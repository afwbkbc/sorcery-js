require('./core/backend');

Sorcery.require([
  'service/cli',
  //'service/test',
],function(Cli){
  Cli.initialize();
});

/*var args = process.argv.splice(2);

var cmd = args[0];
args = args.splice(1);
*/

