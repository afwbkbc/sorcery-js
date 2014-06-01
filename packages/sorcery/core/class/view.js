Sorcery.define([
  'class/class',
],function(Class){
  
  Sorcery.require_environment(Sorcery.ENVIRONMENT_WEB);
  
  return Class.extend({

    construct : Sorcery.method(function(me) {
      var sid=Sorcery.begin();
      
      console.log('PARENT CONSTRUCT',me);
      
      return Sorcery.end(sid);
    }),
    
    destroy : Sorcery.method(function() {
      var sid=Sorcery.begin();
      
      console.log('PARENT DESTROY');
      
      return Sorcery.end(sid);
    })
    
  });
});