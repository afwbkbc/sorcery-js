Sorcery.define([],function(){
  var cls={
      class_name : 'class',
      
      extend : function(additional) {
        var ret=additional;
        for (var i in this) {
          if (typeof(ret[i])==='undefined')
            ret[i]=this[i];
        }
        ret.this_class=ret;
        ret.parent_class=this;
        return ret;
      }
  };
  cls.this_class=cls;
  cls.parent_class=null;
  return cls;
});