Sorcery.define([
  'class/command',
  'service/fs',
  'service/cli',
],function(Command,Fs,Cli){
  
  return Command.extend({
    
    run : function() {
      
      console.log('asd');
      
    },
    
    description : function() {
      return 'update .htaccess with currently enable routes';
    }
    
  });
  
});