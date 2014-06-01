Sorcery.define([
  'class/class',
],function(Class){
  
  Sorcery.require_environment(Sorcery.ENVIRONMENT_WEB);
  
  return Class.extend({

    construct : function(done) {
      console.log('PARENT CONSTRUCT');
      return done();
    },
    
    destroy : function(done) {
      console.log('PARENT DESTROY');
      return done();
    }
    
  });
});