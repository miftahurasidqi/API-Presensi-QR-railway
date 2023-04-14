const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Pegawai = require("../models/pegawai");

const EnkripsiPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  const passwordTerenkripsi = await bcrypt.hash(password, salt);
  return passwordTerenkripsi;
};

const tambahPegawai = async (req, res) => {
  const { nama, nip, password, peran } = req.body;

  // Validasi data yang diterima dari request
  if (!nama || !nip || !password) {
    return res.status(400).json({ message: "Nama, NIP dan password harus disertakan" });
  }

  try {
    // Mengecek apakah nip sudah ada dalam database
    const cekNIP = await Pegawai.findOne({ nip });
    if (cekNIP) {
      return res.status(400).json({ message: "NIP sudah digunakan" });
    }
    // enkripsi password
    const passwordTerenkripsi = await EnkripsiPassword(password);
    // Membuat pegawai baru
    const pegawaiBaru = new Pegawai({ nama, nip, password: passwordTerenkripsi, peran });
    // Menyimpan pegawai baru ke database
    await pegawaiBaru.save();
    const response = { nama, nip, peran };
    // Mengirimkan response dengan pegawai yang baru dibuat
    res.status(201).json(response);
  } catch (error) {
    console.error("Gagal menambahkan pegawai:", error);
    res.status(500).json({ message: "Gagal menambahkan pegawai" });
  }
};

const semuaPegawai = async (req, res) => {
  try {
    // Get the page number from the query parameter or use 1 as the default
    const halaman = parseInt(req.query.halaman) || 1;
    const dataPerHalaman = 10;

    // Calculate the total number of documents to determine the number of pages
    const totalDocuments = await Pegawai.countDocuments();
    const totalHalaman = Math.ceil(totalDocuments / dataPerHalaman);
    const skip = (halaman - 1) * dataPerHalaman;

    // Retrieve employees from the database using pagination and sort them by name in ascending order
    const data = await Pegawai.find({}, { _id: 0, password: 0, __v: 0 }).sort({ nama: 1 }).skip(skip).limit(dataPerHalaman);

    // Send a response with the list of employees, current page, and total number of pages
    res.status(200).json({ data, halaman, totalHalaman });
  } catch (error) {
    console.error("Gagal mengambil data pegawai:", error);
    res.status(500).json({ message: "Gagal mengambil data pegawai" });
  }
};

const login = async (req, res) => {
  const { nip, password } = req.body;

  try {
    let pegawai = await Pegawai.findOne({ nip });
    if (!pegawai) {
      if (nip === process.env.ADMINNIP && password === process.env.ADMINPASS) {
        const passwordTerenkripsi = await EnkripsiPassword(password);
        // Membuat pegawai baru
        const pegawaiBaru = new Pegawai({ nama: "admin", nip, password: passwordTerenkripsi, peran: "admin" });
        // Menyimpan pegawai baru ke database
        await pegawaiBaru.save();
        const response = { nama, nip, peran };
      } else {
        return res.status(400).json({ message: "NIP atau password salah 1" });
      }
    }

    const isPasswordValid = await bcrypt.compare(password, pegawai.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: "NIP atau password salah 2" });
    }
    const token = jwt.sign({ id: pegawai._id, peran: pegawai.peran }, process.env.JWT_SECRET || "secret", {
      expiresIn: "1w",
    });

    res.json({ token });
  } catch (error) {
    res.status(500).json({ message: "Terjadi kesalahan saat mencoba login" });
  }
};

const profil = async (req, res) => {
  try {
    const user = req.user;
    // Mencari pegawai berdasarkan ID
    const pegawai = await Pegawai.findById(user.id, { _id: 0, password: 0, __v: 0 });
    if (!pegawai) {
      // Jika pegawai tidak ditemukan, kirimkan pesan error
      return res.status(404).json({ message: "Data tidak ditemukan" });
    }
    res.status(200).json({ data: pegawai });
  } catch (error) {
    console.error("Gagal mengambil data profil:", error);
    res.status(500).json({ message: "Gagal mengambil data profil" });
  }
};

module.exports = {
  tambahPegawai,
  semuaPegawai,
  login,
  profil,
};
