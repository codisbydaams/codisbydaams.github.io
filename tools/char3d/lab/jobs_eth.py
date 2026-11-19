import json,sys
exec(open('jobs_mh.py').read().split('out=[]')[0])
out=[]
for nm,t in [('none',{}),('cauc1',{'caucasian-male-young':1}),('third',{'caucasian-male-young':.34,'african-male-young':.33,'asian-male-young':.33}),('oval',{'head-oval':.6}),('square',{'head-square':.75})]:
    out.append({'name':'eth_'+nm,'cfg':spec('male',targets=t,hair='short04'),'yaw':-.5,'z':1,'focus':'face'})
json.dump(out,open(sys.argv[1],'w'))
