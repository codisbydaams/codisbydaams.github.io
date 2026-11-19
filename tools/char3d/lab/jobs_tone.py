import json,sys
exec(open('jobs_mh.py').read().split('out=[]')[0])
exec(open('jobs_faces.py').read().split('out=[]')[0].split('F=json')[1].join(['F=json','']) if False else '')
TONES=[('t1','light','light',0,'#fff2ea'),('t2','light','light',0,'#ffffff'),('t3','light','mid',.5,'#fbf1e6'),('t4','mid','mid',0,'#ffffff'),('t5','mid','dark',.3,'#f6e7da'),('t6','mid','dark',.55,'#efdccd'),('t7','dark','dark',0,'#ffffff'),('t8','dark','dark',0,'#d9c3b4')]
EYES=['brown','brownlight','green','bluegreen','blue','lightblue','grey']
out=[]
for i,(tid,a,b,mx,tint) in enumerate(TONES):
    for sex in ['male','female']:
        out.append({'name':'%s_%s'%(sex,tid),'cfg':spec(sex,skin={'a':a,'b':b,'mix':mx,'tint':tint},hair='short04' if sex=='male' else 'ponytail01',eye={'tex':EYES[i%7]},scalpTint=.7),'yaw':-.35,'z':1,'focus':'face'})
json.dump(out,open(sys.argv[1],'w'))
