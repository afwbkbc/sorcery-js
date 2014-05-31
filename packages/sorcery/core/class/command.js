Sorcery.define([
  'class/class',
],function(Class){
  
  Sorcery.require_environment(Sorcery.ENVIRONMENT_CLI);
  
  return Class.extend({
    
    class_name : 'command',
    
    run : function(parameters) {
      throw new Error('Please define run() method for "'+parameters[0]+'" command!');
    },
    
    description : function() {
      return 'No description yet';
    },
    
  });
  
});