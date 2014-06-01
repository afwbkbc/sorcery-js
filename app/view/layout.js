Sorcery.define([
  'class/view',
],function(View){
  
  return View.extend({
    
    construct : Sorcery.method(function() {
      var sid=Sorcery.begin();
      
      return Sorcery.end(sid);
    }),
    
    destroy : Sorcery.method(function() {
      var sid=Sorcery.begin();
      
      return Sorcery.end(sid);
    })
    
  });
  
});