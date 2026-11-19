import json,sys
F={'m1':{},'f1':{}}
out=[]
for b in ['male','female']:
  hair={'male':{'mesh':'Hair_SimpleParted'},'female':{'mesh':'Hair_Long','native':{'Hair_Long':'female'}}}[b]
  cfg={'body':b,'face':{'id':b[0]+'1','p':{}},'hair':hair,'color':'#3a2418'}
  for nm,yaw,z in [('body_front',0,0),('body_side',1.5708,0),('body_back',3.1416,0),('face_front',0,1),('face_45',-0.785,1),('face_side',-1.5708,1)]:
    out.append({'name':b+'_'+nm,'cfg':cfg,'yaw':yaw,'z':z})
json.dump(out,open(sys.argv[1],'w'))
