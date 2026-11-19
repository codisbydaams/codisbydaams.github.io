import json,sys
exec(open('jobs_mh.py').read().split('out=[]')[0])
T=['none','eye-corner1-up','eye-corner2-up','eye-corner1-down','eye-corner2-down','eye-height2-incr','eye-height2-decr','eye-eyefold-down','eye-epicanthus-in','eye-scale-incr','eye-trans-out','eye-height1-decr','eye-push1-in','eye-eyefold-angle-up']
out=[]
for t in T:
    tg={} if t=='none' else {'l-'+t:.9,'r-'+t:.9}
    out.append({'name':t,'cfg':spec('female',targets=tg,hair='ponytail01',scalpTint=.7),'yaw':-.2,'z':1,'focus':'face','size':[600,300]})
json.dump(out,open(sys.argv[1],'w'))
