Sorcery.define([
  'class/service',
],function(Service){

  return Service.extend({
    
    get_random_ascii_string : Sorcery.method(function(length,chars){
      var sid=Sorcery.begin();
      if (!chars)
        chars='abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
      var result = '';
      for (var i = length; i > 0; --i) result += chars[Math.round(Math.random() * (chars.length - 1))];
      Sorcery.end(sid,result);
    }),
  
  });
  
});