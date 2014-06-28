Sorcery.define([
  'class/view',
],function(View){
  return View.extend({
    
    construct : Sorcery.method(function(){
      var sid=Sorcery.begin();
      
      console.log('test2 construct');
      
      return Sorcery.end(sid);
    }),
    
    destroy : Sorcery.method(function(){
      var sid=Sorcery.begin();
      
      console.log('test2 destroy');
      
      return Sorcery.end(sid);
    }),
    
  });
})