#!/usr/bin/env node
var program = require('commander'),
    fs = require('fs-extra'),
    chalk = require('chalk'),
    inquirer = require('inquirer'),
    utils = require('./utils');

utils.init();

program
    .parse(process.argv);

/**
 * Display the help text
 */
function displayHelpText() {
  console.log();
  console.log('    Usage: astrum figma [command]');
  console.log();
  console.log('    Commands:');
  console.log('      info\tdisplays current Figma settings');
  console.log('      edit\tedits Figma settings');
  console.log();
}

/**
 * Display the current Figma settings
 */
function displayFigmaSettings() {
  console.log("Your Figma Personal Access Token is: " + chalk.green(utils.$data.figma.token));
  console.log("Your Figma file URL is: " + chalk.green(utils.$data.figma.url));
}

/**
 * Edit the current Figma settings
 */
function editFigmaSettings() {
  // we want the default values to be the current settings, if they exist
  var defaultToken = '';
  var defaultURL = '';
  if (utils.$data.figma) {
    defaultToken = utils.$data.figma.token;
    defaultURL = utils.$data.figma.url;
  }

  inquirer.prompt([
      {
          name: 'token',
          message: function () {
              console.log();
              console.log(chalk.yellow('Figma Personal Access Token:'));
              console.log(chalk.yellow('----------------------------------------------------------------'));
              console.log(chalk.yellow('For instructions on how to locate your personal access token visit this URL:'));
              console.log(chalk.yellow('https://www.figma.com/developers/docs#auth-dev-token'));
              console.log();
              return 'Figma Personal Access Token:'
          },
          default: defaultToken,
          validate: function (str) {
              return str !== '';
          }
      },
      {
          name: 'url',
          message: function () {
            console.log();
            console.log(chalk.yellow('Figma File URL:'));
            console.log(chalk.yellow('----------------------------------------------------------------'));
            console.log(chalk.yellow('Provide the URL to the Figma file continaing the components you want to import.'));
            console.log();
            return 'Figma file URL:'
          },
          default: defaultURL,
          validate: function (str) {
              return str !== '';
          }
      },
  ]).then(function (answers) {
    utils.$data.figma = answers;
    utils.saveData(function() {
      console.log();
      console.log(chalk.green("\u2713 Figma settings saved successfully."));
      console.log();
    });
  });
}

/**
 * astrum figma
 *
 * prompt to import settings, otherwise displays the help text
 */
if (process.argv.length < 3) {
  if (!utils.$data.figma) {
    console.log(chalk.red('No Figma settings found!'));
    editFigmaSettings();
  } else {
    displayHelpText();
  }
}

/**
 * astrum figma info
 *
 * prompt to import settings, otherwise displays the current Figma settings
 */
if (process.argv[2] == 'info') {
  if (!utils.$data.figma) {
    console.log(chalk.red('No Figma settings found!'));
    editFigmaSettings();
  } else {
    displayFigmaSettings();
  }
}

/**
 * astrum figma edit
 */
if (process.argv[2] == 'edit') {
  editFigmaSettings();
}
