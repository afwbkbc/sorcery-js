require('./core/backend');

Sorcery.require([
  'service/cli',
  'service/test',
],function(Cli,Test){
  console.log('REQUIRED',Cli,Test);
});

/*var args = process.argv.splice(2);

var cmd = args[0];
args = args.splice(1);
*/

