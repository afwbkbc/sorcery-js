Sorcery.define([
  'class/command',
],function(Command){
  
  return Command.extend({
    
    run : function(parameters) {
      console.log('runned',parameters);
    }
    
  });
  
});