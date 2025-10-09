// Adapted from qrcode.js by Kazuhiko Arase (MIT License)
// https://github.com/kazuhikoarase/qrcode-generator
// The implementation is trimmed to the features needed for generating QR modules.

const QR_ERROR_CORRECTION = {
  L: 1,
  M: 0,
  Q: 3,
  H: 2,
};

const QR_MODE = {
  NUMBER: 1,
  ALPHA_NUM: 2,
  BYTE: 4,
  KANJI: 8,
};

const QR_PAD0 = 0xEC;
const QR_PAD1 = 0x11;

const ALPHA_NUM_CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:';

function getLowestMode(s) {
  if (/^[0-9]*$/.test(s)) return QR_MODE.NUMBER;
  if (/^[0-9A-Z $%*+\-./:]*$/.test(s)) return QR_MODE.ALPHA_NUM;
  return QR_MODE.BYTE;
}

const QRUtil = {
  PATTERN_POSITION_TABLE: [
    [],
    [6, 18],
    [6, 22],
    [6, 26],
    [6, 30],
    [6, 34],
    [6, 22, 38],
    [6, 24, 42],
    [6, 26, 46],
    [6, 28, 50],
    [6, 30, 54],
    [6, 32, 58],
    [6, 34, 62],
    [6, 26, 46, 66],
    [6, 26, 48, 70],
    [6, 26, 50, 74],
    [6, 30, 54, 78],
    [6, 30, 56, 82],
    [6, 30, 58, 86],
    [6, 34, 62, 90],
    [6, 28, 50, 72, 94],
    [6, 26, 50, 74, 98],
    [6, 30, 54, 78, 102],
    [6, 28, 54, 80, 106],
    [6, 32, 58, 84, 110],
    [6, 30, 58, 86, 114],
    [6, 34, 62, 90, 118],
    [6, 26, 50, 74, 98, 122],
    [6, 30, 54, 78, 102, 126],
    [6, 26, 52, 78, 104, 130],
    [6, 30, 56, 82, 108, 134],
    [6, 34, 60, 86, 112, 138],
    [6, 30, 58, 86, 114, 142],
    [6, 34, 62, 90, 118, 146],
    [6, 30, 54, 78, 102, 126, 150],
    [6, 24, 50, 76, 102, 128, 154],
    [6, 28, 54, 80, 106, 132, 158],
    [6, 32, 58, 84, 110, 136, 162],
    [6, 26, 54, 82, 110, 138, 166],
    [6, 30, 58, 86, 114, 142, 170],
  ],

  G15: (1 << 10) | (1 << 8) | (1 << 5) | (1 << 4) | (1 << 2) | (1 << 1) | 1,
  G15_MASK: (1 << 12) | (1 << 11) | (1 << 10) | (1 << 9) | (1 << 8) | (1 << 5) | (1 << 2) | 1,
  G18: (1 << 12) | (1 << 11) | (1 << 10) | (1 << 9) | (1 << 8) | (1 << 5) | (1 << 2) | 1,

  getBCHTypeInfo(data) {
    let d = data << 10;
    while (QRUtil.getBCHDigit(d) - QRUtil.getBCHDigit(QRUtil.G15) >= 0) {
      d ^= QRUtil.G15 << (QRUtil.getBCHDigit(d) - QRUtil.getBCHDigit(QRUtil.G15));
    }
    return ((data << 10) | d) ^ QRUtil.G15_MASK;
  },

  getBCHTypeNumber(data) {
    let d = data << 12;
    while (QRUtil.getBCHDigit(d) - QRUtil.getBCHDigit(QRUtil.G18) >= 0) {
      d ^= QRUtil.G18 << (QRUtil.getBCHDigit(d) - QRUtil.getBCHDigit(QRUtil.G18));
    }
    return (data << 12) | d;
  },

  getBCHDigit(data) {
    let digit = 0;
    while (data !== 0) {
      digit += 1;
      data >>>= 1;
    }
    return digit;
  },

  getPatternPosition(typeNumber) {
    return QRUtil.PATTERN_POSITION_TABLE[typeNumber - 1] || [];
  },

  getMask(maskPattern, i, j) {
    switch (maskPattern) {
      case 0: return (i + j) % 2 === 0;
      case 1: return i % 2 === 0;
      case 2: return j % 3 === 0;
      case 3: return (i + j) % 3 === 0;
      case 4: return (Math.floor(i / 2) + Math.floor(j / 3)) % 2 === 0;
      case 5: return ((i * j) % 2) + ((i * j) % 3) === 0;
      case 6: return (((i * j) % 2) + ((i * j) % 3)) % 2 === 0;
      case 7: return (((i + j) % 2) + ((i * j) % 3)) % 2 === 0;
      default: return false;
    }
  },
};

function QRBitBuffer() {
  this.buffer = [];
  this.length = 0;
}

QRBitBuffer.prototype = {
  get(index) {
    const bufIndex = Math.floor(index / 8);
    return ((this.buffer[bufIndex] >>> (7 - (index % 8))) & 1) === 1;
  },

  put(num, length) {
    for (let i = 0; i < length; i += 1) {
      this.putBit(((num >>> (length - i - 1)) & 1) === 1);
    }
  },

  putBit(bit) {
    const bufIndex = Math.floor(this.length / 8);
    if (this.buffer.length <= bufIndex) {
      this.buffer.push(0);
    }
    if (bit) {
      this.buffer[bufIndex] |= (0x80 >>> (this.length % 8));
    }
    this.length += 1;
  },
};

function QRPolynomial(num, shift) {
  if (num.length === undefined) {
    throw new Error(`${num.length}/${shift}`);
  }

  let offset = 0;
  while (offset < num.length && num[offset] === 0) {
    offset += 1;
  }
  this.num = new Array(num.length - offset + shift);
  for (let i = 0; i < num.length - offset; i += 1) {
    this.num[i] = num[i + offset];
  }
}

QRPolynomial.prototype = {
  multiply(e) {
    const num = new Array(this.getLength() + e.getLength() - 1);
    for (let i = 0; i < this.getLength(); i += 1) {
      for (let j = 0; j < e.getLength(); j += 1) {
        num[i + j] ^= QRMath.gexp(QRMath.glog(this.get(i)) + QRMath.glog(e.get(j)));
      }
    }
    return new QRPolynomial(num, 0);
  },

  mod(e) {
    if (this.getLength() < e.getLength()) {
      return this;
    }

    const ratio = QRMath.glog(this.get(0)) - QRMath.glog(e.get(0));
    const num = this.num.slice();

    for (let i = 0; i < e.getLength(); i += 1) {
      num[i] ^= QRMath.gexp(QRMath.glog(e.get(i)) + ratio);
    }

    return new QRPolynomial(num, 0).mod(e);
  },

  getLength() {
    return this.num.length;
  },

  get(index) {
    return this.num[index];
  },
};

const QRMath = {
  EXP_TABLE: new Array(256),
  LOG_TABLE: new Array(256),

  glog(n) {
    if (n < 1) throw new Error(`glog(${n})`);
    return QRMath.LOG_TABLE[n];
  },

  gexp(n) {
    while (n < 0) {
      n += 255;
    }
    while (n >= 256) {
      n -= 255;
    }
    return QRMath.EXP_TABLE[n];
  },
};

for (let i = 0; i < 8; i += 1) {
  QRMath.EXP_TABLE[i] = 1 << i;
}
for (let i = 8; i < 256; i += 1) {
  QRMath.EXP_TABLE[i] = QRMath.EXP_TABLE[i - 4]
    ^ QRMath.EXP_TABLE[i - 5]
    ^ QRMath.EXP_TABLE[i - 6]
    ^ QRMath.EXP_TABLE[i - 8];
}
for (let i = 0; i < 255; i += 1) {
  QRMath.LOG_TABLE[QRMath.EXP_TABLE[i]] = i;
}

function QRRSBlock(totalCount, dataCount) {
  this.totalCount = totalCount;
  this.dataCount = dataCount;
}

QRRSBlock.RS_BLOCK_TABLE = [
  // L
  // M
  // Q
  // H

  // 1
  [1, 26, 19],
  [1, 26, 16],
  [1, 26, 13],
  [1, 26, 9],

  // 2
  [1, 44, 34],
  [1, 44, 28],
  [1, 44, 22],
  [1, 44, 16],

  // 3
  [1, 70, 55],
  [1, 70, 44],
  [2, 35, 17],
  [2, 35, 13],

  // 4
  [1, 100, 80],
  [2, 50, 32],
  [2, 50, 24],
  [4, 25, 9],

  // 5
  [1, 134, 108],
  [2, 67, 43],
  [2, 33, 15, 2, 34, 16],
  [2, 33, 11, 2, 34, 12],

  // 6
  [2, 86, 68],
  [4, 43, 27],
  [4, 43, 19],
  [4, 43, 15],

  // 7
  [2, 98, 78],
  [4, 49, 31],
  [2, 32, 14, 4, 33, 15],
  [4, 39, 13, 1, 40, 14],

  // 8
  [2, 121, 97],
  [2, 60, 38, 2, 61, 39],
  [4, 40, 18, 2, 41, 19],
  [4, 40, 14, 2, 41, 15],

  // 9
  [2, 146, 116],
  [3, 58, 36, 2, 59, 37],
  [4, 36, 16, 4, 37, 17],
  [4, 36, 12, 4, 37, 13],

  // 10
  [2, 86, 68, 2, 87, 69],
  [4, 69, 43, 1, 70, 44],
  [6, 43, 19, 2, 44, 20],
  [6, 43, 15, 2, 44, 16],
];

QRRSBlock.getRSBlocks = function getRSBlocks(typeNumber, errorCorrectLevel) {
  const rsBlock = QRRSBlock.RS_BLOCK_TABLE[(typeNumber - 1) * 4 + errorCorrectLevel];

  if (!rsBlock) {
    throw new Error(`bad rs block @ typeNumber:${typeNumber}/errorCorrectLevel:${errorCorrectLevel}`);
  }

  const list = [];
  for (let i = 0; i < rsBlock.length / 3; i += 1) {
    const count = rsBlock[i * 3 + 0];
    const totalCount = rsBlock[i * 3 + 1];
    const dataCount = rsBlock[i * 3 + 2];
    for (let j = 0; j < count; j += 1) {
      list.push(new QRRSBlock(totalCount, dataCount));
    }
  }
  return list;
};

function QR8bitByte(data) {
  this.mode = QR_MODE.BYTE;
  this.data = data;
  this.parsedData = [];

  for (let i = 0; i < this.data.length; i += 1) {
    const code = this.data.charCodeAt(i);
    if (code > 0xFF) {
      throw new Error(`illegal char ${code}`);
    }
    this.parsedData.push(code);
  }
}

QR8bitByte.prototype = {
  getLength() {
    return this.parsedData.length;
  },

  write(buffer) {
    for (let i = 0; i < this.parsedData.length; i += 1) {
      buffer.put(this.parsedData[i], 8);
    }
  },
};

function QRAlphaNum(data) {
  this.mode = QR_MODE.ALPHA_NUM;
  this.data = data;
}

QRAlphaNum.prototype = {
  getLength() {
    return this.data.length;
  },

  write(buffer) {
    let i = 0;
    while (i + 1 < this.data.length) {
      const value = ALPHA_NUM_CHARS.indexOf(this.data.charAt(i)) * 45
        + ALPHA_NUM_CHARS.indexOf(this.data.charAt(i + 1));
      buffer.put(value, 11);
      i += 2;
    }
    if (i < this.data.length) {
      const value = ALPHA_NUM_CHARS.indexOf(this.data.charAt(i));
      buffer.put(value, 6);
    }
  },
};

function QRNumber(data) {
  this.mode = QR_MODE.NUMBER;
  this.data = data;
}

QRNumber.prototype = {
  getLength() {
    return this.data.length;
  },

  write(buffer) {
    let i = 0;
    while (i + 3 <= this.data.length) {
      buffer.put(parseInt(this.data.substr(i, 3), 10), 10);
      i += 3;
    }
    if (i < this.data.length) {
      const remaining = this.data.length - i;
      if (remaining === 2) {
        buffer.put(parseInt(this.data.substr(i, 2), 10), 7);
      } else if (remaining === 1) {
        buffer.put(parseInt(this.data.substr(i, 1), 10), 4);
      }
    }
  },
};

function createData(typeNumber, errorCorrectLevel, dataList) {
  const rsBlocks = QRRSBlock.getRSBlocks(typeNumber, errorCorrectLevel);

  const buffer = new QRBitBuffer();
  for (let i = 0; i < dataList.length; i += 1) {
    const data = dataList[i];
    buffer.put(data.mode, 4);
    const length = data.getLength();
    const lengthBits = getLengthInBits(data.mode, typeNumber);
    buffer.put(length, lengthBits);
    data.write(buffer);
  }

  let totalDataCount = 0;
  for (let i = 0; i < rsBlocks.length; i += 1) {
    totalDataCount += rsBlocks[i].dataCount;
  }

  if (buffer.length + 4 <= totalDataCount * 8) {
    buffer.put(0, 4);
  }

  while (buffer.length % 8 !== 0) {
    buffer.putBit(false);
  }

  while (buffer.length < totalDataCount * 8) {
    buffer.put(QR_PAD0, 8);
    if (buffer.length >= totalDataCount * 8) break;
    buffer.put(QR_PAD1, 8);
  }

  let offset = 0;
  const data = new Array(totalDataCount);
  for (let i = 0; i < totalDataCount; i += 1) {
    data[i] = buffer.buffer[i];
  }

  const blocks = [];
  for (let r = 0; r < rsBlocks.length; r += 1) {
    const dataCount = rsBlocks[r].dataCount;
    const totalCount = rsBlocks[r].totalCount;
    const dataCodes = new Array(dataCount);
    for (let i = 0; i < dataCount; i += 1) {
      dataCodes[i] = data[offset + i];
    }
    offset += dataCount;
    const rsPoly = getErrorCorrectPolynomial(totalCount - dataCount);
    const rawPoly = new QRPolynomial(dataCodes, 0);
    const modPoly = rawPoly.mod(rsPoly);
    const errorCodes = new Array(totalCount - dataCount);
    for (let i = 0; i < errorCodes.length; i += 1) {
      const modIndex = i + modPoly.getLength() - errorCodes.length;
      errorCodes[i] = modIndex >= 0 ? modPoly.get(modIndex) : 0;
    }
    blocks.push({ dataCodes, errorCodes });
  }

  let index = 0;
  const dataCountMax = Math.max(...blocks.map(b => b.dataCodes.length));
  const ecCountMax = Math.max(...blocks.map(b => b.errorCodes.length));
  const totalCodeCount = rsBlocks.reduce((sum, block) => sum + block.totalCount, 0);
  const result = new Array(totalCodeCount);

  for (let i = 0; i < dataCountMax; i += 1) {
    for (let r = 0; r < blocks.length; r += 1) {
      if (i < blocks[r].dataCodes.length) {
        result[index] = blocks[r].dataCodes[i];
        index += 1;
      }
    }
  }
  for (let i = 0; i < ecCountMax; i += 1) {
    for (let r = 0; r < blocks.length; r += 1) {
      if (i < blocks[r].errorCodes.length) {
        result[index] = blocks[r].errorCodes[i];
        index += 1;
      }
    }
  }

  return result;
}

function getLengthInBits(mode, type) {
  if (type >= 1 && type < 10) {
    switch (mode) {
      case QR_MODE.NUMBER: return 10;
      case QR_MODE.ALPHA_NUM: return 9;
      case QR_MODE.BYTE: return 8;
      default: return 8;
    }
  }
  if (type < 27) {
    switch (mode) {
      case QR_MODE.NUMBER: return 12;
      case QR_MODE.ALPHA_NUM: return 11;
      case QR_MODE.BYTE: return 16;
      default: return 16;
    }
  }
  switch (mode) {
    case QR_MODE.NUMBER: return 14;
    case QR_MODE.ALPHA_NUM: return 13;
    case QR_MODE.BYTE: return 16;
    default: return 16;
  }
}

function getErrorCorrectPolynomial(errorCorrectLength) {
  let a = new QRPolynomial([1], 0);
  for (let i = 0; i < errorCorrectLength; i += 1) {
    a = a.multiply(new QRPolynomial([1, QRMath.gexp(i)], 0));
  }
  return a;
}

function createDataList(text, mode) {
  switch (mode) {
    case QR_MODE.NUMBER:
      return [new QRNumber(text)];
    case QR_MODE.ALPHA_NUM:
      return [new QRAlphaNum(text)];
    default:
      return [new QR8bitByte(text)];
  }
}

function getTypeNumber(text, mode, errorCorrectLevel) {
  for (let typeNumber = 1; typeNumber <= 40; typeNumber += 1) {
    const rsBlocks = QRRSBlock.getRSBlocks(typeNumber, errorCorrectLevel);
    const dataList = createDataList(text, mode);
    let totalDataCount = 0;
    for (let i = 0; i < rsBlocks.length; i += 1) {
      totalDataCount += rsBlocks[i].dataCount;
    }
    const buffer = new QRBitBuffer();
    for (let i = 0; i < dataList.length; i += 1) {
      const data = dataList[i];
      buffer.put(data.mode, 4);
      buffer.put(data.getLength(), getLengthInBits(data.mode, typeNumber));
      data.write(buffer);
    }
    if (buffer.length <= totalDataCount * 8) {
      return typeNumber;
    }
  }
  return 40;
}

function createMatrices(typeNumber, errorCorrectLevel, data) {
  const moduleCount = typeNumber * 4 + 17;
  const modules = new Array(moduleCount);
  for (let row = 0; row < moduleCount; row += 1) {
    modules[row] = new Array(moduleCount);
    for (let col = 0; col < moduleCount; col += 1) {
      modules[row][col] = null;
    }
  }

  const setupPositionProbePattern = (row, col) => {
    for (let r = -1; r <= 7; r += 1) {
      if (row + r <= -1 || moduleCount <= row + r) continue;
      for (let c = -1; c <= 7; c += 1) {
        if (col + c <= -1 || moduleCount <= col + c) continue;
        if ((0 <= r && r <= 6 && (c === 0 || c === 6))
          || (0 <= c && c <= 6 && (r === 0 || r === 6))
          || (2 <= r && r <= 4 && 2 <= c && c <= 4)) {
          modules[row + r][col + c] = true;
        } else {
          modules[row + r][col + c] = false;
        }
      }
    }
  };

  setupPositionProbePattern(0, 0);
  setupPositionProbePattern(moduleCount - 7, 0);
  setupPositionProbePattern(0, moduleCount - 7);

  const setupTimingPattern = () => {
    for (let i = 8; i < moduleCount - 8; i += 1) {
      if (modules[i][6] === null) {
        modules[i][6] = i % 2 === 0;
      }
      if (modules[6][i] === null) {
        modules[6][i] = i % 2 === 0;
      }
    }
  };

  setupTimingPattern();

  const setupPositionAdjustPattern = () => {
    const pos = QRUtil.getPatternPosition(typeNumber);
    for (let i = 0; i < pos.length; i += 1) {
      for (let j = 0; j < pos.length; j += 1) {
        const row = pos[i];
        const col = pos[j];
        if (modules[row][col] !== null) continue;
        for (let r = -2; r <= 2; r += 1) {
          for (let c = -2; c <= 2; c += 1) {
            modules[row + r][col + c] = (r === 0 && c === 0)
              || (r === -2 || r === 2 || c === -2 || c === 2);
          }
        }
      }
    }
  };

  setupPositionAdjustPattern();

  const setupTypeNumber = (test) => {
    if (typeNumber < 7) return;
    const bits = QRUtil.getBCHTypeNumber(typeNumber);
    for (let i = 0; i < 18; i += 1) {
      const mod = (!test && ((bits >> i) & 1) === 1);
      modules[Math.floor(i / 3)][i % 3 + moduleCount - 8 - 3] = mod;
      modules[i % 3 + moduleCount - 8 - 3][Math.floor(i / 3)] = mod;
    }
  };

  const setupTypeInfo = (test, maskPattern) => {
    const bits = QRUtil.getBCHTypeInfo((QR_ERROR_CORRECTION[errorCorrectLevel] << 3) | maskPattern);

    for (let i = 0; i < 15; i += 1) {
      const mod = (!test && ((bits >> i) & 1) === 1);

      if (i < 6) {
        modules[i][8] = mod;
      } else if (i < 8) {
        modules[i + 1][8] = mod;
      } else {
        modules[moduleCount - 15 + i][8] = mod;
      }

      if (i < 8) {
        modules[8][moduleCount - i - 1] = mod;
      } else if (i < 9) {
        modules[8][15 - i - 1 + 1] = mod;
      } else {
        modules[8][15 - i - 1] = mod;
      }
    }

    modules[moduleCount - 8][8] = !test;
  };

  let inc = -1;
  let row = moduleCount - 1;
  let bitIndex = 0;
  let byteIndex = 0;
  const maskPattern = 0; // we will pick best later

  for (let col = moduleCount - 1; col > 0; col -= 2) {
    if (col === 6) col -= 1;
    while (true) {
      for (let c = 0; c < 2; c += 1) {
        if (modules[row][col - c] === null) {
          let dark = false;
          if (byteIndex < data.length) {
            dark = ((data[byteIndex] >>> (7 - bitIndex)) & 1) === 1;
          }
          const mask = QRUtil.getMask(maskPattern, row, col - c);
          modules[row][col - c] = mask ? !dark : dark;
          bitIndex += 1;
          if (bitIndex === 8) {
            byteIndex += 1;
            bitIndex = 0;
          }
        }
      }
      row += inc;
      if (row < 0 || moduleCount <= row) {
        row -= inc;
        inc = -inc;
        break;
      }
    }
  }

  setupTypeInfo(false, maskPattern);
  setupTypeNumber(false);
  return modules;
}

export function generateQrMatrix(text, level = 'M') {
  const sanitized = typeof text === 'string' ? text : String(text ?? '');
  const limited = sanitized.length > 2953 ? sanitized.slice(0, 2953) : sanitized;
  const mode = getLowestMode(limited);
  const typeNumber = getTypeNumber(limited, mode, level);
  const data = createData(typeNumber, level, createDataList(limited, mode));
  return createMatrices(typeNumber, level, data);
}

export default generateQrMatrix;
