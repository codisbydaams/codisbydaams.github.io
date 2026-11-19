import json,sys
exec(open('jobs_mh.py').read().split('out=[]')[0])
F=json.load(open('../faces.json',encoding='utf-8'))
def tw(sex,f):
    t={}
    for e,w in zip(['caucasian','african','asian'],f['e']): t['face-%s-%s'%(e,sex)]=w
    for k,w in f['t'].items():
        if k.startswith('*'):
            for s in 'lr': t[s+'-'+k[1:]]=w
        else: t[k]=w
    return t
out=[]
for sex in ['male','female']:
  for f in F[sex]:
    for nm,yaw in [('a',0),('b',-0.8)]:
      out.append({'name':'%s_%s'%(f['id'],nm),'cfg':spec(sex,targets=tw(sex,f),hair='short04' if sex=='male' else 'ponytail01',scalpTint=.7),'yaw':yaw,'z':1,'focus':'face'})
json.dump(out,open(sys.argv[1],'w'))
