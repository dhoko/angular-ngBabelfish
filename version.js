var fs = require('fs');

if(process.argv.length < 3) {
  throw new Error('You should specify a new version');
  process.exit(1);
}

function configPkg(name, version) {
  fs.readFile('./' + name + '.json', function(err, data) {

    if(err) {
      throw err;
    }

    var pkg = JSON.parse(String(data));
      pkg.version = version.trim();

    fs.writeFile('./' + name + '.json', JSON.stringify(pkg,undefined,2), function(err) {

      if(err) {
        throw err;
      }

      console.log('  ✔  Write ' + name + '.json with the version:',version);
    });
  });
}

['bower', 'package'].forEach(function (pkgName) {
  configPkg(pkgName, process.argv[2]);
});
