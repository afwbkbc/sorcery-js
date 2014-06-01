Sorcery.define([
  'class/service'
],function(Service){
  
  Sorcery.require_environment(Sorcery.ENVIRONMENT_WEB);
  
  return Service.extend({
    
    render : Sorcery.method(function(){
      // override it in descendent classes
    }),
    
  });
  
});