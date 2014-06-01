Sorcery.define([
  'class/view',
],function(View){
  
  return View.extend({
    
    my:'my',
    
    construct : function(done,newmy) {
      console.log('CONSTRUCT',newmy);
      this.my=newmy;
      return done();
    },
    
    destroy : function(done,a,b) {
      console.log('DESTROY',a,b);
      return done();
    }
    
  });
  
});