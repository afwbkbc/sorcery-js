Sorcery.define([
  'class/class',
  'service/globals',
  'service/dom',
],function(
  Class,
  Globals,
  Dom
){
  
  Sorcery.require_environment(Sorcery.ENVIRONMENT_WEB);
  
  return Class.extend({
  
    class_name : 'controller',
    
    register : function(Router) {
      // override it and add routes
    },
    
    set_views : Sorcery.method(function(views,path) {
      
      if (typeof(views.length)==='undefined')
        views=[views];
      
      if (typeof(path)==='undefined')
        path='';
      
      var viewskey='views['+path+']';
      
      var currentviews=Globals.retrieve(viewskey);
      if (typeof(currentviews)==='undefined')
        currentviews=[];
      
      var collect=[];
      
      console.log('VIEWS',currentviews,views);
      
      var toadd=[];
      var toremove=[];
      
      for (var i in views) {
        var view=views[i];
        var s=view.selector;
        if (typeof(s)==='undefined') {
          s='body > .container';
          if (!Dom.find(s)) {
            var container=document.createElement('div');
            container.className="container";
            document.body.appendChild(container);
          }
        }
        var t=view.template;
        var a=view.arguments;
        if (typeof(a)==='undefined')
          a=[];
        var p=path+'/'+s;
        collect.push({
          selector:s,
          template:t,
          arguments:a,
        });
        //console.log('TRY',p,s,t);
        //console.log('COLLECT',collect);
        for (var i in currentviews) {
          var v=currentviews[i];
          var match=false;
          for (var ii in collect) {
            var vv=collect[ii];
            console.log('CMPR',v,vv);
          }
          if (!match)
            toremove.push(i);
        }
        for (var i in collect) {
          var v=collect[i];
          var match=false;
          for (var ii in currentviews) {
            var vv=currentviews[ii];
            console.log('CMPA',v,vv);
          }
          if (!match)
            toadd.push(i);
        }
        console.log('RA',toremove,toadd);
        
      }
      
      for (var i in toremove) {
        var v=currentviews[toremove[i]];
        console.log('REMOVE',v);
      }
      /*for (var i in toadd) {
        var v=collect[toadd[i]];
        console.log('TOADD',v);
        
      }*/
      
      var i;
      Sorcery.loop.for(
        function(){ i=0 },
        function(){ return i<toadd.length },
        function(){ i++ },
        function(cont){
          var v=i;
          console.log('ITERATE',i,v);
          cont();
        },
        function(){
          console.log('DONE');
        }
      );
      
      
      console.log('UPDATE',currentviews,collect);
      
      Globals.store(viewskey,collect);
      
    })
    
  });
  
});