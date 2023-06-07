const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Pegawai = require("../models/pegawai");

const EnkripsiPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  const passwordTerenkripsi = await bcrypt.hash(password, salt);
  return passwordTerenkripsi;
};

const tambahPegawai = async (req, res) => {
  try {
    const { nama, nip, status, password, peran } = req.body;
    if (!nama || !nip || !password) return res.status(400).json({ message: "Nama, NIP, Status, role dan password harus disertakan" });

    const cekNIP = await Pegawai.findOne({ nip });
    if (cekNIP) return res.status(400).json({ message: "NIP sudah digunakan" });

    const passwordTerenkripsi = await EnkripsiPassword(password);
    const pegawaiBaru = new Pegawai({ nama, status, nip, password: passwordTerenkripsi, peran });
    await pegawaiBaru.save();

    const response = { nama, status, nip, peran };
    res.status(201).json(response);
  } catch (error) {
    console.error("Gagal menambahkan pegawai:", error);
    res.status(500).json({ message: "Gagal menambahkan pegawai" });
  }
};

const semuaPegawai = async (req, res) => {
  try {
    let halaman = parseInt(req.headers.halaman) || 1;
    const dataPerHalaman = 10;
    const totalDocuments = await Pegawai.countDocuments();
    const totalHalaman = Math.ceil(totalDocuments / dataPerHalaman);
    const skip = (halaman - 1) * dataPerHalaman;

    const user = await Pegawai.find({}, { password: 0, __v: 0 }).sort({ nama: 1 }).skip(skip).limit(dataPerHalaman);
    res.status(200).json({ user, totalDocuments, halaman, totalHalaman });
  } catch (error) {
    console.error("Gagal mengambil data pegawai:", error);
    res.status(500).json({ message: "Gagal mengambil data pegawai" });
  }
};

const login = async (req, res) => {
  const { nip, password } = req.body;
  console.log(req.body);
  try {
    let pegawai = await Pegawai.findOne({ nip });
    if (!pegawai) {
      if (nip === process.env.ADMINNIP && password === process.env.ADMINPASS) {
        const passwordTerenkripsi = await EnkripsiPassword(password);
        const dataPegawai = {
          nama: "admin 1",
          status: "admin",
          nip,
          password: passwordTerenkripsi,
          peran: "admin",
        };
        const pegawaiBaru = new Pegawai(dataPegawai);
        await pegawaiBaru.save();
        pegawai = pegawaiBaru;
      } else {
        return res.status(401).json({ message: "NIP atau password salah 1" });
      }
    }
    const isPasswordValid = await bcrypt.compare(password, pegawai.password);
    if (!isPasswordValid) return res.status(402).json({ message: "NIP atau password salah 2" });

    const token = jwt.sign({ id: pegawai._id, peran: pegawai.peran }, process.env.JWT_SECRET || "secret", {
      expiresIn: "1w",
    });

    res.json({ token, pegawai });
  } catch (error) {
    res.status(500).json({ message: "Terjadi kesalahan saat mencoba login" });
  }
};

const profil = async (req, res) => {
  try {
    const user = req.user;
    const pegawai = await Pegawai.findById(user.id, { _id: 0, password: 0, __v: 0 });
    if (!pegawai) return res.status(404).json({ message: "Data tidak ditemukan" });

    res.status(200).json({ data: pegawai });
  } catch (error) {
    console.error("Gagal mengambil data profil:", error);
    res.status(500).json({ message: "Gagal mengambil data profil" });
  }
};
const edit = async (req, res) => {
  try {
    // const user = req.user;
    const { _id, nama, status, nip, password, peran, fotoProfil } = req.body;
    if (!_id || !nama || !status || !nip || !password || !peran) return res.status(400).json({ msg: "Nama, Email, Password dan jabatan harus disertakan" });

    const passwordTerenkripsi = await EnkripsiPassword(password);
    const user = {
      nama,
      nip,
      status,
      password: passwordTerenkripsi,
      peran,
      fotoProfil,
    };

    const findPegawai = await Pegawai.findOne({ _id: _id });
    if (!findPegawai) return res.status(400).json({ msg: "User tidak ditemukan" });

    const cekNIP = await Pegawai.findOne({ nip });
    if (cekNIP) {
      if (cekNIP._id == _id) {
        await Pegawai.findOneAndUpdate({ _id: _id }, { $set: user });
        res.status(200).json({ user });
      } else {
        return res.status(400).json({ msg: "Email sudah digunakan" });
      }
    } else {
      console.log("Email belum digunakan");
      const User = await Pegawai.findOneAndUpdate({ _id: _id }, { $set: user });
      if (!User) return res.status(404).json({ msg: "user tidak ditemukan" });
      res.status(200).json({ user });
    }
  } catch (error) {
    res.status(500).json({ msg: "Gagal mengambil user profil" });
  }
};

const hapus = async (req, res) => {
  try {
    console.log(req.body);
    const { _id } = req.body;
    console.log(_id);
    const cariPegawai = await Pegawai.findOne({ _id: _id });
    if (!cariPegawai) return res.status(400).json({ msg: "User tidak ditemukan" });
    await Pegawai.findByIdAndDelete(_id);
    await Pegawai.deleteMany;
    res.status(200).json({ msg: "berhasil Menghapus user" });
  } catch (error) {
    res.status(500).json({ msg: "Gagal menghapus user" });
  }
};
module.exports = {
  tambahPegawai,
  semuaPegawai,
  login,
  profil,
  edit,
  hapus,
};
