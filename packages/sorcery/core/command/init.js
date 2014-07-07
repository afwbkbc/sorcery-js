Sorcery.define([
  'class/command',
  'service/fs',
  'service/cli',
],function(Command,Fs,Cli){

  return Command.extend({
    
    run : function() {
      
      var chk=Fs.list_directory('./app');
      if (chk.length>0) {
        Cli.print('Unable to initialize - app/ is not empty.\n');
        return Sorcery.exit();
      }
      
      var files=[
        'frontend.js',
        'backend.js',
        'controller/default.js',
        'view/default.js',
        'template/default.html',
      ];
      
      var src='initskel/';
      var dst='app/';
      console.log('x',Sorcery.resource_cache);
      for (var i in files) {
        var f=files[i];
        var r=Sorcery.resolve_resource(src+f);
        console.log('R',f,r);
        if (r!==null) {
          Fs.copy_file(r,dst+f);
        }
      }
      
    },
    
    description : function() {
      return 'initialize basic app structure';
    }
    
  });

});
