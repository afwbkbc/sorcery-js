Sorcery.define([
  'class/command',
  'library/cli',
  'library/fs',
],function(Command,Cli,Fs){
  
  return Command.extend({
    
    run : function(parameters) {
      Cli.print('Available commands:\n');
      var paths=Sorcery.get_require_paths();
      for (var i in paths) {
        var path=paths[i]+'command';
        var listed=false;
        try {
          var files=Fs.list_directory(path);
          listed=true;
          for (var ii in files) {
            var file=files[ii].replace(/.js/g,'');
            Cli.print('\t'+file);
            if (file=='help')
              Cli.print(' - '+this.description()+'\n');
            else {
              Sorcery.require(path+'/'+file,function(Command){
                Cli.print(' - '+Command.description()+'\n');
              });
            }
          }
        } catch (e) {
          if (listed)
            throw e;
        }
      }
     
    },
    
    description : function() {
      return 'list all available commands';
    },
    
  });
  
});