Sorcery.define([
  'class/class',
  'service/globals',
  'service/dom',
  'service/algorithms'
],function(
  Class,
  Globals,
  Dom,
  Algorithms
){
  
  Sorcery.require_environment(Sorcery.ENVIRONMENT_WEB);
  
  return Class.extend({
  
    class_name : 'controller',
    
    register : function(Router) {
      // override it and add routes
    },
    
    set_views : Sorcery.method(function(views,path) {
      
      var sid=Sorcery.begin();
      
      if (typeof(views.length)==='undefined')
        views=[views];
      
      if (typeof(path)==='undefined')
        path='';
      
      var viewskey='views['+path+']';
      
      Globals.retrieve(viewskey,function(currentviews){
        if (currentviews===null)
          currentviews=[];

        var collect=[];

        //console.log('VIEWS',currentviews,views);

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
          
          var sameviews=function(v,vv){
            return (v.template===vv.template)&&(Algorithms.objects_equal(v.arguments,vv.arguments));
          }
          
          for (var i in currentviews) {
            var v=currentviews[i];
            var match=false;
            for (var ii in collect) {
              var vv=collect[ii];
              if (v.selector===vv.selector) {
                if (sameviews(v,vv))
                  match=true;
                break;
              }
            }
            if (!match)
              toremove.push(i);
          }
          for (var i in collect) {
            var v=collect[i];
            var match=false;
            for (var ii in currentviews) {
              var vv=currentviews[ii];
              if (v.selector===vv.selector) {
                //console.log('CMPA',v,vv);
                if (sameviews(v,vv))
                  match=true;
                break;
              }
            }
            if (!match)
              toadd.push(i);
          }

        }

        //console.log('RA',toremove,toadd);

        var i;
        Sorcery.loop.for(
          function(){ i=0 },
          function(){ return i<toremove.length },
          function(){ i++ },
          function(cont){
            var v=currentviews[i];
            
            Sorcery.destroy(v.view,function(){
              //console.log('REMOVE',i,v);
              cont();
            });
            
          },
          function(){
            
            Sorcery.loop.for(
              function(){ i=0 },
              function(){ return i<toadd.length },
              function(){ i++ },
              function(cont){
                var v=collect[i];
                Sorcery.require('view/'+v.template,function(ViewTemplate){
                  Sorcery.construct(ViewTemplate,Dom.find(v.selector),function(vo){
                    collect[i].view=vo;
                    vo.set(collect[i].arguments,function(){
                      vo.render();
                      cont();
                    });
                  });
                });
              },
              function(){
                //console.log('UPDATE',currentviews,collect);

                Globals.store(viewskey,collect,function(){
                  
                  return Sorcery.end(sid);

                });
              }
            );

          }
        );


      });
    })
    
  });
  
});