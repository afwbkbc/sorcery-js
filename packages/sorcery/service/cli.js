Sorcery.define([
  'class/service',
],function(Service){
  return Service.extend({

    service_name : 'cli',
    
    initialize : function() {
      console.log('cli initialized');
    }
    
  });
  
});