Sorcery.define([
  'class/class',
],function(Class){
  
  return Class.extend({
  
    class_name : 'controller',
    
    register : function(Router) {
      // override it and add routes
    }
    
  });
  
});