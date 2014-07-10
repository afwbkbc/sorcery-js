Sorcery.define([
  'class/class',
  'service/globals',
  'service/algorithms',
  'service/dom'
],function(
  Class,
  Globals,
  Algorithms,
  Dom
){
  
  return Class.extend({
  
    class_name : 'controller',
    
    register : function(Router) {
      // override it and add routes
    },
    
    set_views : Sorcery.method(function(views,path,baseel) {

      //console.log('SET_VIEWS',views,path,baseel);
      
      var sid=Sorcery.begin();
      if (typeof(baseel)==='undefined')
        baseel=document;
      
      if (typeof(views.length)==='undefined')
        views=[views];
      
      if (typeof(path)==='undefined')
        path='';
      
      var viewskey='views/'+path;
      
      var self=this;
      
      Globals.retrieve(viewskey,function(currentviews){
        if (currentviews===null)
          currentviews=[];

        var collect=[];

        var toadd=[];
        var toremove=[];
        var collectchildren=[];

        var i;
        Sorcery.loop.for(
          function(){ i=0 },
          function(){ return i<views.length },
          function(){ i++ },
          function(cont) {
            var view=views[i];
            //console.log('VIEW',view);
            var s=view.selector;
            if (typeof(s)==='undefined') {
              s='body > .container';
              if (!baseel.querySelector(s)) {
                var container=document.createElement('div');
                container.className="container";
                document.body.appendChild(container);
              }
            }
            var t=view.template;
            var a=view.arguments;
            if (typeof(a)==='undefined')
              a={};
            var p=path+'/'+s;
            collect.push({
              selector:s,
              template:t,
              arguments:a
            });

            if (view.children) {
              collectchildren.push({
                view:collect[collect.length-1],
                children:view.children
              });
            }
            
            return cont();
          },
          function(){
            var sameviews=function(v,vv){
              return (v.template===vv.template)&&(Algorithms.objects_equal(v.arguments,vv.arguments));
            };

            for (var ii in currentviews) {
              var v=currentviews[ii];
              var match=false;
              for (var iii in collect) {
                var vv=collect[iii];
                if (v.selector===vv.selector) {
                  //console.log('ASD',v,vv,sameviews(v,vv));
                  if (sameviews(v,vv)) {
                    if (typeof(v.view)!=='undefined') {
                      if (v.view._destroyed||!Dom.is_in_tree(v.view.el))
                        break;
                    }
                    //console.log('keep',currentviews[ii]);
                    match=true;
                  }
                  break;
                }
              }
              if (!match) {
                //console.log('REMOVE',currentviews[ii]);
                toremove.push(ii);
              }
            }
            for (var ii in collect) {
              var v=collect[ii];
              var match=false;
              for (var iii in currentviews) {
                var vv=currentviews[iii];
                if (v.selector===vv.selector) {
                  //console.log('QWE',v,vv,sameviews(v,vv));
                  if (sameviews(v,vv)) {
                    if (typeof(vv.view)!=='undefined') {
                      if (vv.view._destroyed||!Dom.is_in_tree(vv.view.el)) {
                        break;
                      }
                    }
                    //console.log('noadd',v);
                    match=true;
                    v.view=vv.view;
                  }
                  break;
                }
              }
              if (!match) {
                //console.log('ADD',collect[ii]);
                toadd.push(ii);
              }
            }

            //console.log('RA',toremove,toadd,collect,collectchildren);

            var i;
            Sorcery.loop.for(
              function(){ i=0 },
              function(){ return i<toremove.length },
              function(){ i++ },
              function(cont){
                var k=toremove[i];
                var v=currentviews[k];
                if (!v.view._destroyed)
                  v.view.remove(cont);
                else return cont();
              },
              function(){
                var ii;
                Sorcery.loop.for(
                  function(){ ii=0 },
                  function(){ return ii<toadd.length },
                  function(){ ii++ },
                  function(cont){
                    var k=toadd[ii];
                    var v=collect[k];
                    Sorcery.require('view/'+v.template,function(ViewTemplate){
                      var selector=v.selector;
                      if (baseel!==document)
                        selector='[data-view="'+baseel.getAttribute('data-view')+'"] '+selector;
                      Sorcery.construct(ViewTemplate,baseel.querySelector(selector),function(vo){
                        collect[k].view=vo;
                        vo.set(collect[k].arguments,function(){
                          vo.render(function(){
                            cont();
                          });

                        });
                      });
                    });
                  },
                  function(){
                    //console.log('UPDATE',viewskey,currentviews,collect);

                    Globals.store(viewskey,collect,function(){

                      var iii;
                      Sorcery.loop.for(
                        function(){ iii=0 },
                        function(){ return iii<collectchildren.length },
                        function(){ iii++ },
                        function(cont) {
                          var c=collectchildren[iii];
                          if (typeof(c.view.view)!=='undefined') {
                            var p=c.view.selector;
                            if (path!=='')
                              p=path+'/'+p;
                            var children;
                            if (typeof(c.children)==='object') {
                              if (typeof(c.children[0])==='object')
                                children=c.children;
                              else {
                                children=[];
                                for (var iiii in c.children) {
                                  var child;
                                  if (typeof(c.children[iiii]==='string'))
                                    child={
                                      template:c.children[iiii]
                                    };
                                  else
                                    child=c.children[iiii];
                                  child.selector=iiii;
                                  children.push(child);
                                }
                              }
                            }
                            else
                              throw new Error('children is not an object');
                            //console.log('PROCESS',p,c.view,c.children);
                            self.set_views(children,p,c.view.view.el,cont);
                          }
                          else
                            return cont();
                        },
                        function() {
                          //console.log('DONE');
                          return Sorcery.end(sid);
                        }
                      );

                    });
                  }
                );

              }
            );

            
          }
        );


      });
    })
    
  });
  
});