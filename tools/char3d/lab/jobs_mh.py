import json,sys
def spec(sex, **k):
    s={'sex':sex,'build':'avg','height':.5,'targets':{},'skin':{'a':'light','b':'mid','mix':.35,'tint':'#ffffff'},'eye':{'tex':'brown'},
       'brows':'eyebrow001' if sex=='male' else 'eyebrow006','lashes':'eyelashes01' if sex=='male' else 'eyelashes02','hair':'short02' if sex=='male' else 'long01','beard':None,
       'outfit':'male_casualsuit06' if sex=='male' else 'female_casualsuit01','shoes':'shoes06','hairColor':'#3a2418','browColor':'#2a1a10','beardColor':'#2a1a10'}
    s.update(k); return s
out=[]
for b in ['male','female']:
  for nm,yaw,z,f in [('body_front',0,0,'body'),('body_side',1.5708,0,'body'),('body_back',3.1416,0,'body'),('face_front',0,1,'face'),('face_45',-0.785,1,'face'),('face_side',-1.5708,1,'face')]:
    out.append({'name':b+'_'+nm,'cfg':spec(b),'yaw':yaw,'z':z,'focus':f})
json.dump(out,open(sys.argv[1],'w'))
