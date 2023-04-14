const konversiWaktu = () => {
  const GMT = new Date();
  const GMT7set = 7 * 60 * 60 * 1000;
  const GMT7 = GMT.getTime() + GMT7set;
  const GMT7Time = new Date(GMT7);
  return GMT7Time;
};

module.exports = konversiWaktu;
