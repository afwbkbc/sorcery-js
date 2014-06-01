Sorcery.define([
  'class/class',
],function(Class){
  return Class.extend({

    view:'view',

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