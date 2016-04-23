"use strict";

var co = require('co');
var path = require('path');
var chalk = require('chalk');
var numeral = require('numeral');
var Arduino = require('../arduino');

var size = co.wrap(function*(argv, options) {
  options.root = options.root || process.cwd();
  var arduino = new Arduino(options.root);

  var prefs = arduino.populate({
    transform: false,
    data: {
      'build.path': path.resolve(options.root, options.path),
      'build.project_name': options.name
    }
  });

  var size;
  try {
    size = arduino.size(prefs);
  } catch (e) {
    console.error("Couldn't determine program size.");
    throw e;
  }

  console.log("Sketch uses %s bytes (%s) of program storage space. Maximum is %s bytes.",
    chalk.yellow.bold(numeral(size.text).format('0,0')),
    chalk.yellow.bold(numeral(size.text * 100 / size.textmax).format('0.00') + '%'),
    chalk.yellow.bold(numeral(size.textmax).format('0,0')));

  if (size.data >= 0) {
    if (size.datamax > 0) {
      console.log("Global variables use %s bytes (%s) of dynamic memory, leaving %s bytes for local variables. Maximum is %s bytes.",
        chalk.yellow.bold(numeral(size.data).format('0,0')),
        chalk.yellow.bold(numeral(size.data * 100 / size.datamax).format('0.00') + '%'),
        chalk.yellow.bold(numeral(size.datamax - size.data).format('0,0')),
        chalk.yellow.bold(numeral(size.datamax).format('0,0')));
    } else {
      console.log("Global variables use %s bytes of dynamic memory.", chalk.yellow.bold(numeral(size.data).format('0,0')));
    }
  }

  if (size.text > size.textmax) {
    console.error("Sketch too big; see http://www.arduino.cc/en/Guide/Troubleshooting#size for tips on reducing it.");
  }

  if (size.datamax > 0 && size.data > size.datamax) {
    console.error("Not enough memory; see http://www.arduino.cc/en/Guide/Troubleshooting#size for tips on reducing your footprint.");
  }

  var warnDataPercentage = parseInt(prefs["build_warn_data_percentage"]);
  if (size.datamax > 0 && size.data > size.datamax * warnDataPercentage / 100) {
    console.error("Low memory available, stability problems may occur.");
  }
});

size.describe = ['size [root]', 'Calculate the <path>/<name>.elf'];
size.options = {
  path: {
    alias: 'p',
    required: true,
    describe: 'The build path where the target is'
  },
  name: {
    alias: 'n',
    required: true,
    describe: 'The target name to calc'
  }
};

module.exports = size;