Sorcery.define([
  'class/service',
],function(Service){
  return Service.extend({
    
    routes : [],
    
    initialize : function(controllers) {
      if (controllers) {
        for (var i in controllers) {
          var c=controllers[i];
          if (c.class_name==='controller') {
            c.register(this);
          }
        }
      }
    },
    
    route : function(route) {
      this.routes.push(route);
    },
    
  });
  
});