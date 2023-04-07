const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Pegawai = require("../models/pegawai");

const tambahData = async (nama, email, password, peran) => {
  const salt = await bcrypt.genSalt(10);
  const passwordTerenkripsi = await bcrypt.hash(password, salt);

  // Membuat pegawai baru
  const pegawaiBaru = new Pegawai({ nama, email, password: passwordTerenkripsi, peran });

  // Menyimpan pegawai baru ke database
  await pegawaiBaru.save();
  return pegawaiBaru;
};

const tambahPegawai = async (req, res) => {
  const { nama, email, password, peran } = req.body;

  // Validasi data yang diterima dari request
  if (!nama || !email || !password) {
    return res.status(400).json({ message: "Nama, email dan password harus disertakan" });
  }

  try {
    // Mengecek apakah email sudah ada dalam database
    const cekEmail = await Pegawai.findOne({ email });
    if (cekEmail) {
      return res.status(400).json({ message: "Email sudah digunakan" });
    }

    // Membuat pegawai baru
    const pegawaiBaru = await tambahData(nama, email, password, peran);

    // Mengirimkan response dengan pegawai yang baru dibuat
    res.status(201).json(pegawaiBaru);
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
  const { email, password } = req.body;

  try {
    let pegawai = await Pegawai.findOne({ email });
    if (!pegawai) {
      if (email === process.env.ADMINEMAIL && password === process.env.ADMINPASS) {
        pegawai = await tambahData(email, email, password, "admin");
      } else {
        return res.status(400).json({ message: "Email atau password salah" });
      }
    }

    const isPasswordValid = await bcrypt.compare(password, pegawai.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: "Email atau password salah" });
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
    console.log(user);
    // Mencari pegawai berdasarkan ID
    const pegawai = await Pegawai.findById(req.user.id, { _id: 0, password: 0, __v: 0 });

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
