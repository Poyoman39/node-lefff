const fs = require('fs');
const path = require('path');

const lefffMlexPath = path.join(__dirname, 'lefff-3.4.mlex/lefff-3.4.mlex');

// const lefffMlex = require('./lefff-3.4.mlex/lefff-3.4.mlex');

// // Create a stream from some character device.
// const stream = fs.createReadStream('/dev/input/event0');
// setTimeout(() => {
//   stream.close(); // This may not close the stream.
//   // Artificially marking end-of-stream, as if the underlying resource had
//   // indicated end-of-file by itself, allows the stream to close.
//   // This does not cancel pending read operations, and if there is such an
//   // operation, the process may still not be able to exit successfully
//   // until it finishes.
//   stream.push(null);
//   stream.read(0);
// }, 100);

const loadLefffMlexFile = () => new Promise((resolve, reject) => {
  const lefffMlexStream = fs.createReadStream(lefffMlexPath, {
    encoding: 'utf8',
  });

  const lefffMlex = {};

  let lastLine = '';
  lefffMlexStream.on('data', (chunk) => {
    const lines = `${lastLine}${chunk}`.split('\n');
    lastLine = lines.pop();

    lines.forEach((line) => {
      const [
        word,
        type,
        lemma,
        mode,
      ] = line.split('\t');

      lefffMlex[word] = lefffMlex[word] || [];

      lefffMlex[word].push({
        type,
        lemma,
        mode,
      });
    });
  });

  lefffMlexStream.on('end', () => {
    lefffMlexStream.close();
    lefffMlexStream.push(null);
    lefffMlexStream.read(0);

    resolve(lefffMlex);
  });

  lefffMlexStream.on('error', (error) => {
    reject(error);
  });
});

const expandMode = (mode) => ({
  indicatif: /[PFIJ]/.test(mode),
  conditionnel: /[C]/.test(mode),
  impératif: /[Y]/.test(mode),
  subjonctif: /[ST]/.test(mode),
  participe: /[KG]/.test(mode),
  infinitif: /[W]/.test(mode),
  présent: /[PCYSGW]/.test(mode),
  futur: /[F]/.test(mode),
  imparfait: /[IT]/.test(mode),
  passéSimple: /[J]/.test(mode),
  passé: /[K]/.test(mode),
  premièrePersonne: /[1]/.test(mode),
  deuxièmePersonne: /[2]/.test(mode),
  troisièmePersonne: /[3]/.test(mode),
  masculin: /[m]/.test(mode),
  féminin: /[f]/.test(mode),
  singulier: /[s]/.test(mode),
  pluriel: /[p]/.test(mode),
});

const defaultConf = {
  logger: console,
};

const load = async (userConf = {}) => {
  const conf = {
    ...defaultConf,
    ...userConf,
  };

  conf.logger.debug('[node-leff] Start loading source file');
  const lefffMlex = await loadLefffMlexFile();
  conf.logger.debug('[node-leff] End loading source file');

  return {
    lefffMlex,
    lem: (word) => lefffMlex[word]?.[0]?.lemma || word,
    infos: (word) => lefffMlex[word],
    expandMode,
  };
};

const nodeLefff = {
  load,
};

module.exports = nodeLefff;
