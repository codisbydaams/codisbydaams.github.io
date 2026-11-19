import json,sys
exec(open('jobs_mh.py').read().split('out=[]')[0])
out=[]
for sex in ['male','female']:
  for b in ['slim','avg','athl','broad']:
    for nm,yaw in [('front',0),('side',1.5708)]:
      out.append({'name':'%s_%s_%s'%(sex,b,nm),'cfg':spec(sex,build=b),'yaw':yaw,'z':0,'focus':'body'})
json.dump(out,open(sys.argv[1],'w'))
