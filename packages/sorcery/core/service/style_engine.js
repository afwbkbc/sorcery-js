Sorcery.define([
  'class/service'
],function(Service){
  
  return Service.extend({
    
    render : Sorcery.method(function(){
      var sid=Sorcery.begin();
      
      // override it in descendent classes
      
      return Sorcery.end(sid);
    }),
    
  });
  
});