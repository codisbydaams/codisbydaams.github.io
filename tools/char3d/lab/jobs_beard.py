import json,sys
exec(open('jobs_mh.py').read().split('out=[]')[0])
B={'full':dict(layers=7,len=.0085,rep=64,sparse=.08),'short':dict(layers=4,len=.0038,rep=70,sparse=.14),'stubble':dict(layers=1,len=.0005,rep=85,sparse=.52),
   'goatee':dict(layers=5,len=.0058,rep=66,sparse=.1),'mustache':dict(layers=5,len=.0048,rep=66,sparse=.08),'chin':dict(layers=5,len=.0058,rep=66,sparse=.1)}
out=[]
for k,v in B.items():
    sh=dict(region='beard',style=k,**v)
    out.append({'name':'beard_'+k,'cfg':spec('male',beardShell=sh,beardTint=.5 if k!='stubble' else .35,scalpTint=.6),'yaw':-.6,'z':1,'focus':'face'})
for k in ['buzz','fade','crew']:
    sh=dict(region='scalp',style=k,layers=1 if k!='crew' else 3,len=.0006 if k!='crew' else .003,rep=90,sparse=.2 if k!='crew' else 0)
    out.append({'name':'scalp_'+k,'cfg':spec('male',hair=None,scalpShell=sh,scalpTint=.75),'yaw':-.9,'z':1,'focus':'hair'})
out.append({'name':'f_long_tint','cfg':spec('female',scalpTint=.9),'yaw':-.5,'z':1,'focus':'hair'})
json.dump(out,open(sys.argv[1],'w'))
