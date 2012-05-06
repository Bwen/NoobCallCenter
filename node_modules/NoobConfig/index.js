var fs = require('fs')
  , configFiles = {};

if (!process.env.ENV_TYPE) {
  console.error('#################################################################');
  console.error('# The enviroment variable "ENV_TYPE" must be set according      #');
  console.error('# to your /config/*.ini for theses script to work correctly     #');
  console.error('#################################################################');
  process.exit(0);
}

function get (filename) {
  if (configFiles.hasOwnProperty(filename)) {
    return configFiles[filename].getEnv(process.env.ENV_TYPE);
  }

  try {
    var file = fs.readFileSync('config/'+filename+'.ini', 'utf-8')
      , lines = file.split("\n")
      , matches = []
      , previousSection = ''
      , section = ''
      , isHeaderLine = false;
  }
  catch (Error) {
    return null;
  }

  config = new ConfigFile();
  for (var i=0; i < lines.length; i++) {
    // if empty line or commented out line
    if (lines[i] == '' || lines[i].match(/^;/)) {
        continue;
    }

    isHeaderLine = false;

    // If we have a section that does not "extends" from another
    matches = lines[i].match(/\[([a-z]{4,})\]/i);
    if (matches) {
      section = matches[1];
      isHeaderLine = true;
    }

    // If we have a section that extends from another
    matches = lines[i].match(/\[([a-z]{4,})\s:\s([a-z]{4,})\]/i);
    if (matches) {
      section = matches[1];
      config.addExtend(section, matches[2]);
      isHeaderLine = true;
    }

    if (!isHeaderLine) {
      config.addLineToSection(section, lines[i]);
    }

    previousSection = section;
  }

  configFiles[filename] = config;
  return configFiles[filename].getEnv(process.env.ENV_TYPE);
}


function ConfigFile () {
  this.sections = {};
  this.exts = {};
}

ConfigFile.prototype.addExtend = function (name, extendName) {
  if (!this.exts.hasOwnProperty(name)) {
    this.exts[name] = '';
  }

  this.exts[name] = extendName;
}

ConfigFile.prototype.addLineToSection = function (name, line) {
  if (!this.sections.hasOwnProperty(name)) {
    this.sections[name] = {};
  }

  var match = line.match(/^([a-z0-9\._]*)\s+\=\s+(.*)$/i)
    , currentArray = []

  if (!match) {
    console.error('#### Invalid characters for line:', line);
    return;
  }

  var parts = match[1].split(".")
    , value = match[2].replace(/^\s+|\s+$/, "").replace(/^"/, "").replace(/"$/, "");

  for (var i=0; i < parts.length; i++) {
    var index = parts[i].replace(/^\s+|\s+$/, "");
    if (i == 0) {
      currentArray = this.sections[name];
    }


    if (i == (parts.length-1)) {
      if (value.match(/^\d+$/)) {
          value = parseFloat(value);
      }
      else if (value.match(/^true$/i)) {
          value = true;
      }
      else if (value.match(/^false$/i)) {
          value = false;
      }
      else if (value.match(/^null$/i)) {
          value = null;
      }
      else {
          value = value.toString();
      }

      currentArray[ index ] = value;
    }
    else if (!currentArray.hasOwnProperty(index)) {
      currentArray = currentArray[ index ] = {};
    }
    else {
        currentArray = currentArray[ index ];
    }
  }
}

ConfigFile.prototype.getEnv = function (env) {
  if (!this.sections.hasOwnProperty(env) && !this.sections.hasOwnProperty(this.exts[env]) ) {
     console.log('#### No configs for enviroment: ', env);
     process.exit(0);
  }

  var configs = [];
  if (this.exts.hasOwnProperty(env)) {
    configs = this.sections[this.exts[env]];
  }

  return MergeRecursive(configs, this.sections[env]);
}

function MergeRecursive(obj1, obj2) {
  for (var p in obj2) {
    try {
      // Property in destination object set; update its value.
      if ( obj2[p].constructor==Object ) {
        obj1[p] = MergeRecursive(obj1[p], obj2[p]);
      }
      else {
        obj1[p] = obj2[p];
      }
    }
    catch(e) {
      // Property in destination object not set; create it and set its value.
      obj1[p] = obj2[p];
    }
  }

  return obj1;
}

module.exports = get
