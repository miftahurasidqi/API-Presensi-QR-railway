const crypto = require("crypto");
const Kehadiran = require("../models/kehadiran");
const KodeQR = require("../models/kodeqr");
const Pegawai = require("../models/pegawai");

function membuatKode(length) {
  return crypto
    .randomBytes(Math.ceil(length / 2))
    .toString("hex")
    .slice(0, length);
}

const tampilkanKode = async (req, res) => {
  const kode = membuatKode(10);
  try {
    const kodeBaru = new KodeQR({ kode });

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
    const { kode, jenis } = req.body;

    // Mencari kode
    const dataKode = await KodeQR.findOne({ kode });

    if (!dataKode) {
      // Jika pegawai tidak ditemukan, kirimkan pesan error
      return res.status(404).json({ message: "Kode QR tidak ditemukan" });
    }
    await KodeQR.findOneAndDelete({ kode });
    // Mencari pegawai berdasarkan ID
    const pegawai = await Pegawai.findById(req.user.id);

    if (!pegawai) {
      // Jika pegawai tidak ditemukan, kirimkan pesan error
      return res.status(404).json({ message: "Pegawai tidak ditemukan" });
    }

    let dataKehadiran;

    if (jenis === "pulang") {
      // Membuat variabel tanggal untuk awal dan akhir hari ini
      const jamMulai = new Date();
      jamMulai.setHours(0, 0, 0, 0);

      const jamAkhir = new Date();
      jamAkhir.setHours(23, 59, 59, 999);

      dataKehadiran = await Kehadiran.findOneAndUpdate({ pegawai: pegawai._id, datang: { $gte: jamMulai, $lt: jamAkhir }, pulang: { $exists: false } }, { $set: { pulang: Date.now() } }, { new: true });
    } else {
      // Membuat kehadiran baru
      const kehadiranBaru = new Kehadiran({
        pegawai: pegawai._id,
      });
      // Menyimpan kehadiran baru ke database
      dataKehadiran = await kehadiranBaru.save();
    }

    // Mengirimkan response dengan kehadiran yang baru dibuat
    res.status(201).json({ message: "Berhasil", data: dataKehadiran });
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
