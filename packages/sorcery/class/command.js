Sorcery.define([
  'class/class',
],function(Class){
  
  return Class.extend({
    
    run : function(parameters) {
      throw new Error('Please define run() method for "'+parameters[0]+'" command!');
    },
    
    description : function() {
      return 'No description yet';
    },
    
  });
  
});