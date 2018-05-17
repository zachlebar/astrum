#!/usr/bin/env node
var program = require('commander'),
    fs = require('fs-extra'),
    chalk = require('chalk'),
    inquirer = require('inquirer'),
    utils = require('./utils'),
    fetch = require('node-fetch');

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
 * Figma API Request helper function
 */
function apiRequest(endpoint) {
  return fetch('https://api.figma.com/v1' + endpoint, {
      method: 'GET',
      headers: { "x-figma-token": utils.$data.figma.token }
  }).then(function(response) {
      return response.json();
  }).catch(function (error) {
      return { err: error };
  });
}

/**
 * Pull the File key from the Figma URL
 */
function getFileKey(pageUrl) {
  // console.log(pageUrl);
  // pageUrl = pageUrl.replace(/https:\/\/www.figma.com\/file\//, '').replace(/\/.*/,'');
  // console.log(pageUrl);
  return pageUrl.replace(/https:\/\/www.figma.com\/file\//, '').replace(/\/.*/,'');
}

/**
 * Fetch the Figma components from the existing URL
 */
function fetchFigmaComponents() {
  if (utils.$data.figma) {
    apiRequest('/files/' + getFileKey(utils.$data.figma.url))
      .then(function (apiResponse) {
        console.log();
        for (nodeID in apiResponse.components) {
          var component = {};

          if (nodeID.charAt(0) != '-') {
            component.nodeID = nodeID;
            component.title = apiResponse.components[nodeID].name;
            buildComponent(component);
          }
        }
        console.log();
      }
    );
  } else {
    console.log(chalk.red('No Figma settings found!'));
    editFigmaSettings();
  }
}

/**
 * Build the Astrum components from the Figma info
 */
function buildComponent(component) {

  // make sure we have a valid potential component
  if (utils.validateComponent(component.title)) {
    var parts = component.title.split("/");
    var newComponent = {};

    // fill in our component details with some reasonable defaults
    newComponent.group = parts[0].toLowerCase();
    newComponent.name = parts[1].toLowerCase();
    newComponent.title = parts[1];
    newComponent.width = 'half';
    newComponent.nodeID = component.nodeID;

    // if this is a new group
    if (!utils.groupExists(newComponent.group)) {
      var newGroup = {};

      newGroup.name = newComponent.group;
      newGroup.title = parts[0];

      let group_position = utils.$data.groups.length - 1;

      // create the new Group and new Component
      utils.$data.groups.splice(group_position, 0, newGroup);
      utils.$data.groups[group_position].components = [newComponent];

      // create the corresponding files
      if (utils.createComponentFiles(newComponent)) {
          utils.saveData(function () {
              console.log();
              console.log(chalk.grey('----------------------------------------------------------------'));
              console.log(chalk.green('\u2713 Pattern library data saved successfully.'));
              console.log(chalk.grey('----------------------------------------------------------------'));

              console.log();
              console.log(chalk.yellow('Add your group description to ' + utils.$config.path + '/components/' + newComponent.group + '/description.md (Markdown supported)'));
              console.log(chalk.yellow('Add your component markup to ' + utils.$config.path + '/components/' + newComponent.group + '/' + newComponent.name + '/markup.html'));
              console.log(chalk.yellow('Add your component description to ' + utils.$config.path + '/components/' + newComponent.group + '/' + newComponent.name + '/description.md (Markdown supported)'));
              console.log();
          });
      }
    // if this is an existing group
    } else {
      var groupIndex = utils.getGroupIndex(newComponent.group);
      let component_position = utils.getComponentPositionChoices(newComponent.group).length - 1;

      // create the new Component
      utils.$data.groups[groupIndex].components.splice(component_position, 0, newComponent);

      // create the corresponding files
      if (utils.createComponentFiles(newComponent)) {
          utils.saveData(function () {
              console.log();
              console.log(chalk.grey('----------------------------------------------------------------'));
              console.log(chalk.green('\u2713 Pattern library data saved successfully.'));
              console.log(chalk.grey('----------------------------------------------------------------'));

              console.log();
              console.log(chalk.yellow('Add your component markup to ' + utils.$config.path + '/components/' + newComponent.group + '/' + newComponent.name + '/markup.html'));
              console.log(chalk.yellow('Add your component description to ' + utils.$config.path + '/components/' + newComponent.group + '/' + newComponent.name + '/description.md (Markdown supported)'));
              console.log();
          });
      }
    }
  }
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

/**
 * astrum figma fetch
 */
if (process.argv[2] == 'fetch') {
  fetchFigmaComponents();
}
