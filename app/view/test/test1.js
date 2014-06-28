Sorcery.define([
  'class/view',
],function(View){
  return View.extend({
    
    construct : Sorcery.method(function(){
      var sid=Sorcery.begin();
      
      console.log('test1 construct');
      
      return Sorcery.end(sid);
    }),
    
    destroy : Sorcery.method(function(){
      var sid=Sorcery.begin();
      
      console.log('test1 destroy');
      
      return Sorcery.end(sid);
    }),
    
  });
})