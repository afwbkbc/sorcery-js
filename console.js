require('./sorcery');

Sorcery.require([
  'service/cli',
],function(Cli){
  Cli.print('\n');
  var command=Cli.get_parameter(0);
  var helpstring='   use "'+Cli.get_node_path()+' '+Cli.get_app_path()+' help" command to get list of available commands\n\n';
  if (!command)
    command='help';
  
  var loaded=false;
  try {
    Sorcery.require('command/'+command,function(Command){
      loaded=true;
      Command.run(Cli.get_parameters());
      Cli.print('\n');
      return Sorcery.exit();
    });
  } catch (e) {
    if (!loaded) {
      Cli.print('Command "'+command+'" does not exist!\n');
      Cli.print(helpstring);
      return Sorcery.exit();
    }
    else throw e;
  }
  
});
