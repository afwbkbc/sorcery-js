Sorcery.define([
  'class/class',
],function(Class){
  
  Sorcery.require_environment(Sorcery.ENVIRONMENT_WEB);
  
  return Class.extend({
  
    class_name : 'controller',
    
    register : function(Router) {
      // override it and add routes
    }
    
  });
  
});