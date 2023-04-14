const crypto = require("crypto");
const Kehadiran = require("../models/kehadiran");
const KodeQR = require("../models/kodeqr");
const Pegawai = require("../models/pegawai");
const konversiWaktu = require("../middlewares/konversiWaktu");

function membuatKode(length) {
  return crypto
    .randomBytes(Math.ceil(length / 2))
    .toString("hex")
    .slice(0, length);
}

const tampilkanKode = async (req, res) => {
  const jenis = req.body.jenis;
  const kode = await membuatKode(10);
  const tanggal = await konversiWaktu();
  try {
    const kodeBaru = new KodeQR({ kode, tanggal, jenis });
    // Menyimpan kode baru ke database
    await kodeBaru.save();
    // Mengirimkan response dengan kehadiran yang baru dibuat
    res.status(201).json({ data: kodeBaru });
  } catch (error) {
    console.error("Gagal mengambil kode:", error);
    res.status(500).json({ message: "Gagal mengambil kode" });
  }
};

const absen = async (req, res) => {
  try {
    const { kode } = req.body;
    const user = req.user;

    // Mencari kode
    const dataKode = await KodeQR.findOne({ kode });
    if (!dataKode) {
      // Jika pegawai tidak ditemukan, kirimkan pesan error
      return res.status(404).json({ message: "Kode QR tidak ditemukan" });
    }
    // Mencari pegawai berdasarkan ID
    const pegawai = await Pegawai.findById(user.id);
    // Jika pegawai tidak ditemukan, kirimkan pesan error
    if (!pegawai) {
      return res.status(404).json({ message: "Pegawai tidak ditemukan" });
    }

    // Membuat variabel tanggal untuk awal dan akhir hari ini
    const jamMulai = await konversiWaktu();
    const jamAkhir = await konversiWaktu();
    jamMulai.setHours(0, 0, 0, 0);
    jamAkhir.setHours(23, 59, 59, 999);
    // Mencari pegawai apakah sudah absen
    const sudahAbsen = await Kehadiran.findOne({
      pegawai: pegawai._id,
      datang: {
        $gte: jamMulai,
        $lt: jamAkhir,
      },
    });

    // Jika pegawai Belum absen masuk kirim pesan suruh masuk dahulu
    if (!sudahAbsen && dataKode.jenis === "pulang") {
      return res.status(404).json({ message: "Silahkan Absen masuk dahulu" });
    } else if (sudahAbsen && dataKode.jenis === "datang") {
      return res.status(404).json({ message: "Anda sudah Absen masuk, silahkan scan kode QR pulang" });
    }

    let pesan;
    let dataKehadiran;
    const tanggal = await konversiWaktu();
    if (!sudahAbsen && dataKode.jenis === "datang") {
      // Membuat kehadiran baru
      const kehadiranBaru = new Kehadiran({
        pegawai: pegawai._id,
        datang: tanggal,
      });
      // Menyimpan kehadiran baru ke database
      dataKehadiran = await kehadiranBaru.save();
      pesan = "Absen Masuk Berhasil";
    } else if (sudahAbsen && dataKode.jenis === "pulang") {
      dataKehadiran = await Kehadiran.findOneAndUpdate(
        {
          pegawai: pegawai._id,
          datang: {
            $gte: jamMulai,
            $lt: jamAkhir,
          },
          pulang: {
            $exists: false,
          },
        },
        {
          $set: {
            pulang: tanggal,
          },
        },
        { new: true }
      );
      pesan = "Absen Pulang Berhasil";
    }

    const newKode = membuatKode(10);
    await KodeQR.findOneAndUpdate(
      {
        _id: dataKode._id,
      },
      {
        $set: {
          kode: newKode,
        },
      }
    );
    // Mengirimkan response dengan kehadiran yang baru dibuat
    res.status(201).json({ message: pesan, data: dataKehadiran });
  } catch (error) {
    console.error("Gagal menambahkan kehadiran:", error);
    res.status(500).json({ message: "Gagal menambahkan kehadiran" });
  }
};

const semuaKehadiran = async (req, res) => {
  try {
    // Mengambil halaman dari query params, jika tidak ada, gunakan 1 sebagai default
    const halaman = parseInt(req.query.halaman) || 1;

    // Menentukan jumlah data per halaman
    const dataPerHalaman = 10;

    // Menghitung jumlah data yang akan dilewati berdasarkan halaman saat ini
    const skip = (halaman - 1) * dataPerHalaman;
    // Mencari semua kehadiran dengan urutan tanggal descending dan paginasi
    const dataKehadiran = await Kehadiran.find({}, { __v: 0 }).sort({ datang: -1 }).skip(skip).limit(dataPerHalaman).populate("pegawai", { password: 0, __v: 0, peran: 0 });

    // Menghitung jumlah total kehadiran
    const totalData = await Kehadiran.countDocuments();
    const totalHalaman = Math.ceil(totalData / dataPerHalaman);

    // Mengirimkan response dengan data kehadiran dan informasi paginasi
    res.status(200).json({
      kehadiran: dataKehadiran,
      halamanInfo: {
        halaman,
        totalHalaman,
        totalData,
      },
    });
  } catch (error) {
    console.error("Gagal mengambil data kehadiran:", error);
    res.status(500).json({ message: "Gagal mengambil data kehadiran" });
  }
};

module.exports = {
  tampilkanKode,
  absen,
  semuaKehadiran,
};
