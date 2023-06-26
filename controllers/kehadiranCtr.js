const crypto = require("crypto");
const Kehadiran = require("../models/kehadiran");
const KodeQR = require("../models/kodeqr");
const Pegawai = require("../models/pegawai");
const { konversiWaktu } = require("../middlewares/konversiWaktu");
const mongoose = require("mongoose");

function membuatKode(length) {
  return crypto
    .randomBytes(Math.ceil(length / 2))
    .toString("hex")
    .slice(0, length);
}
const getDayValue = (array) => {
  let day;
  if (array === 0) day = "Minggu";
  if (array === 1) day = "Senin";
  if (array === 2) day = "Selasa";
  if (array === 3) day = "Rabu";
  if (array === 4) day = "Kamis";
  if (array === 5) day = "Jum'at";
  if (array === 6) day = "Sabtu";
  return day;
};
const waktu = (time) => {
  if (time == undefined) {
    return { tanggal: "-", jam: "-" };
  } else {
    const year = time.getFullYear();
    const month = time.getMonth() + 1;
    const date = time.getDate();
    const jam = time.getHours();
    const min = time.getMinutes();
    const detik = time.getSeconds();
    const days = time.getDay();
    const day = getDayValue(days);
    const waktu = {
      jam: `${jam}:${min}:${detik}`,
      tgl: `${date}`,
      day: `${day}`,
      tanggal: `${year}-${month}-${date}`,
      jam: `${jam}:${min}:${detik}`,
    };
    return waktu;
  }
};
const ubahFormatResponse = (data) => {
  const kehadiran = [];
  data.map((data, i) => {
    const waktuDatang = waktu(data.datang);
    const waktuPulang = waktu(data.pulang);
    const kehadiranData = {
      _id: data._id,
      pegawai: data.pegawai,
      tanggal: waktuDatang.tanggal,
      tgl: waktuDatang.tgl,
      day: waktuDatang.day,
      datang: waktuDatang.jam,
      pulang: waktuPulang.jam,
    };
    kehadiran.push(kehadiranData);
  });
  return kehadiran;
};

const tampilkanKode = async (req, res) => {
  try {
    const GMT7Time = konversiWaktu();
    const generateKodeMasuk = membuatKode(10);
    const generateKodeKeluar = membuatKode(10);

    console.log(GMT7Time);
    console.log(generateKodeKeluar);
    console.log(generateKodeMasuk);
    let kodeMasuk;
    let kodeKeluar;

    const cariKodeMasuk = await KodeQR.findOne({ jenis: "datang" });
    if (!cariKodeMasuk) {
      const masuk = new KodeQR({ kode: generateKodeMasuk, tanggal: GMT7Time, jenis: "datang" });
      await masuk.save();
      kodeMasuk = masuk;
    } else {
      kodeMasuk = cariKodeMasuk;
    }
    const cariKodeKeluar = await KodeQR.findOne({ jenis: "pulang" });
    if (!cariKodeKeluar) {
      const keluar = new KodeQR({ kode: generateKodeKeluar, tanggal: GMT7Time, jenis: "pulang" });
      await keluar.save();
      kodeKeluar = keluar;
    } else {
      kodeKeluar = cariKodeKeluar;
    }
    console.log([kodeMasuk, kodeKeluar]);
    res.status(201).json({ kodeMasuk, kodeKeluar });
  } catch (error) {
    console.error("Gagal mengambil kode:", error);
    res.status(500).json({ message: "Gagal mengambil kode" });
  }
};

const periksaKehadiranSaya = async (req, res) => {
  try {
    const user = req.user;
    const pegawai = await Pegawai.findById(user.id);
    if (!pegawai) {
      return res.status(404).json({ message: "Pegawai tidak ditemukan" });
    }
    // const { GMT7Time, GMT } = konversiWaktu();
    const mulai = konversiWaktu();
    const akhir = konversiWaktu();
    mulai.setHours(0, 0, 0, 1);
    akhir.setHours(23, 59, 59, 10);

    const periksaAbsenDatang = await Kehadiran.findOne({
      pegawai: pegawai._id,
      datang: {
        $gte: mulai,
        $lt: akhir,
      },
    });
    console.log(periksaAbsenDatang);
    const periksaAbsenPulang = await Kehadiran.findOne({
      pegawai: pegawai._id,
      pulang: {
        $gte: mulai,
        $lt: akhir,
      },
    });
    if (periksaAbsenDatang && periksaAbsenPulang) {
      const waktuDatang = waktu(periksaAbsenDatang.datang);
      const waktuPulang = waktu(periksaAbsenDatang.pulang);
      const datang = {
        jenis: "Absen Datang",
        tanggal: waktuDatang.tanggal,
        jam: waktuDatang.jam,
      };
      const pulang = {
        jenis: "Absen Pulang",
        tanggal: waktuPulang.tanggal,
        jam: waktuPulang.jam,
      };

      return res.status(200).json({ kehadiran: [datang, pulang], message: ["Sudah absen masuk dan pulang", "11"] });
    }
    if (periksaAbsenDatang && !periksaAbsenPulang) {
      const waktuDatang = waktu(periksaAbsenDatang.datang);
      const datang = {
        jenis: "Absen Datang",
        tanggal: waktuDatang.tanggal,
        jam: waktuDatang.jam,
      };

      // return res.status(202).json({ kehadiran: [], message: ["Silahkan scan kode untuk absen masuk", "00"] });
      return res.status(201).json({ kehadiran: [datang], message: ["Sudah absen masuk, belum absen pulang", "10"] });
    }
    if (!periksaAbsenDatang && !periksaAbsenPulang) {
      return res.status(202).json({ kehadiran: [], message: ["Silahkan scan kode untuk absen masuk", "00"] });
    }
  } catch (error) {
    console.log(error);
  }
};

const absen = async (req, res) => {
  try {
    const { kode } = req.body;
    const user = req.user;
    console.log(kode);
    const pegawai = await Pegawai.findById(user.id);
    if (!pegawai) {
      return res.status(404).json({ message: "Pegawai tidak ditemukan" });
    }
    const dataKode = await KodeQR.findOne({ kode });
    if (!dataKode) {
      return res.status(404).json({ message: "Kode QR tidak ditemukan" });
    }

    konversiWaktu();
    // const mulai = new Date();
    // const akhir = new Date();
    const mulai = konversiWaktu();
    const akhir = konversiWaktu();
    mulai.setHours(0, 0, 0, 1);
    akhir.setHours(23, 59, 59, 10);
    // Mencari pegawai apakah sudah absen
    const sudahAbsen = await Kehadiran.findOne({
      pegawai: pegawai._id,
      datang: {
        $gte: mulai,
        $lt: akhir,
      },
    });

    if (!sudahAbsen && dataKode.jenis === "pulang") {
      return res.status(404).json({ message: "Silahkan Absen masuk dahulu" });
    }
    if (sudahAbsen && dataKode.jenis === "datang") {
      return res.status(404).json({ message: "Anda sudah Absen masuk, silahkan scan kode QR pulang" });
    }

    let pesan;
    let dataKehadiran;
    const tanggal = konversiWaktu();

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
            $gte: mulai,
            $lt: akhir,
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

const kehadiranSaya = async (req, res) => {
  try {
    const halaman = parseInt(req.query.halaman) || 1;
    const userId = req.params.id;
    console.log(userId);
    // Menentukan jumlah data per halaman
    const dataPerHalaman = 10;
    console.log("1");
    // Menghitung jumlah data yang akan dilewati berdasarkan halaman saat ini
    const skip = (halaman - 1) * dataPerHalaman;
    // Mencari semua kehadiran dengan urutan tanggal descending dan paginasi
    const dataKehadiran = await Kehadiran.find({ pegawai: userId }, { __v: 0 }).sort({ datang: -1 }).skip(skip).limit(dataPerHalaman).populate("pegawai", { password: 0, __v: 0, peran: 0 });
    console.log("2");

    const totalData = await Kehadiran.countDocuments({ pegawai: userId });
    const totalHalaman = Math.ceil(totalData / dataPerHalaman);
    console.log("3");

    const kehadiran = ubahFormatResponse(dataKehadiran);

    res.status(200).json({
      kehadiran,
      halamanInfo: {
        halaman,
        totalHalaman,
        totalData,
      },
    });
  } catch (error) {
    // console.error("Gagal mengambil data kehadiran:", error);
    res.status(500).json({ message: "Gagal mengambil data kehadiran" });
  }
};
const semuaKehadiran = async (req, res) => {
  try {
    const halaman = parseInt(req.query.halaman) || 1;
    const dataPerHalaman = 10;
    const skip = (halaman - 1) * dataPerHalaman;

    const dataKehadiran = await Kehadiran.find({}, { __v: 0 }).sort({ datang: -1 }).skip(skip).limit(dataPerHalaman).populate("pegawai", { password: 0, __v: 0, peran: 0 });
    const totalData = await Kehadiran.countDocuments();
    const totalHalaman = Math.ceil(totalData / dataPerHalaman);
    const kehadiran = ubahFormatResponse(dataKehadiran);

    res.status(200).json({
      kehadiran,
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

const cariKehadiranByTanggal = async (req, res) => {
  try {
    // console.log(req.headers.tanggal);
    const halaman = parseInt(req.query.halaman) || 1;
    const dataPerHalaman = 10;
    const skip = (halaman - 1) * dataPerHalaman;

    const mulai = new Date(req.headers.tanggal);
    const akhir = new Date(req.headers.tanggal);
    console.log("mulai", mulai, "akhir", akhir);
    mulai.setHours(0, 0, 0, 1);
    akhir.setHours(23, 59, 59, 10);

    const dataKehadiran = await Kehadiran.find(
      {
        datang: {
          $gte: mulai,
          $lt: akhir,
        },
      },
      { __v: 0 }
    )
      .sort({ datang: -1 })
      .skip(skip)
      .limit(dataPerHalaman)
      .populate("pegawai", { password: 0, __v: 0, peran: 0 });

    if (dataKehadiran.length === 0) {
      return res.status(404).json({ message: "Data tidak ditemukan" });
    }

    const totalData = await Kehadiran.countDocuments({
      datang: {
        $gte: mulai,
        $lt: akhir,
      },
    });
    const totalHalaman = Math.ceil(totalData / dataPerHalaman);

    const kehadiran = ubahFormatResponse(dataKehadiran);
    const response = {
      kehadiran,
      halamanInfo: {
        halaman,
        totalHalaman,
        totalData,
      },
    };
    console.log(response);

    // Mengirimkan response dengan data kehadiran dan informasi paginasi
    res.status(200).json(response);
  } catch (error) {
    console.error("Gagal mengambil data kehadiran:", error);
    res.status(500).json({ message: "Gagal mengambil data kehadiran" });
  }
};

const cariByIdAndMonth = async (req, res) => {
  try {
    const halaman = parseInt(req.query.halaman) || 1;
    const userId = req.params.id;
    const inputDate = req.params.month;
    const [year, month] = inputDate.split("-");
    console.log(userId, year, month);

    // Menghitung tanggal awal dan akhir bulan
    const mulai = new Date(year, month - 1, 1);
    const akhir = new Date(year, month, 0);

    const dataPerHalaman = 10;

    const skip = (halaman - 1) * dataPerHalaman;
    const dataPencarian = {
      $and: [
        {
          datang: {
            $gte: mulai,
            $lt: akhir,
          },
        },
        {
          pegawai: userId,
        },
      ],
    };
    const dataKehadiran = await Kehadiran.find(dataPencarian, { __v: 0 }).sort({ datang: 1 }).skip(skip).limit(dataPerHalaman);
    const totalData = await Kehadiran.countDocuments(dataPencarian);

    const totalHalaman = Math.ceil(totalData / dataPerHalaman);
    const kehadiran = ubahFormatResponse(dataKehadiran);

    res.status(200).json({
      kehadiran,
      halamanInfo: {
        halaman,
        totalHalaman,
        totalData,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Gagal mengambil data kehadiran" });
  }
};

const cariKehadiranByName = async (req, res) => {
  console.log(1);
  try {
    const nama = req.params.name;
    console.log(nama);
    const cariPegawai = await Pegawai.findOne({ nama: { $regex: nama, $options: "i" } });
    if (!cariPegawai) return res.status(400).json("data idak ditemukan");
    const cariKehadiran = await Kehadiran.findOne({ pegawai: cariPegawai._id }).sort({ datang: -1 });
    if (!cariKehadiran) return res.status(401).json("data idak ditemukan");
    const kehadiran = [];
    const waktuDatang = waktu(cariKehadiran.datang);
    const waktuPulang = waktu(cariKehadiran.pulang);
    const kehadiranData = {
      _id: cariKehadiran._id,
      pegawai: cariPegawai,
      tanggal: waktuDatang.tanggal,
      tgl: waktuDatang.tgl,
      day: waktuDatang.day,
      datang: waktuDatang.jam,
      pulang: waktuPulang.jam,
    };
    kehadiran.push(kehadiranData);
    console.log(kehadiran);

    res.status(200).json({ kehadiran });
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "Error" });
  }
};
module.exports = {
  tampilkanKode,
  periksaKehadiranSaya,
  absen,
  semuaKehadiran,
  kehadiranSaya,
  cariKehadiranByTanggal,
  cariByIdAndMonth,
  cariKehadiranByName,
};
