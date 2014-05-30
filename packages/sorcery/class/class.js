Sorcery.define([],function(){
  var cls={
      extend : function(additional) {
        var ret=additional;
        for (var i in this) {
          if (typeof(ret[i])==='undefined')
            ret[i]=this[i];
        }
        return ret;
      }
  };
  return cls;
});

