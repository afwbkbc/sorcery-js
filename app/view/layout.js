Sorcery.define([
  'class/view',
],function(View){
  
  return View.extend({
    
    my:'my',
    
    construct : Sorcery.method(function(newmy) {
      var sid=Sorcery.begin();
      
      console.log('CONSTRUCT',newmy);
      this.my=newmy;
      
      return Sorcery.end(sid);
    }),
    
    destroy : Sorcery.method(function(a,b) {
      var sid=Sorcery.begin();
      
      console.log('DESTROY',a,b);
      
      return Sorcery.end(sid);
    })
    
  });
  
});