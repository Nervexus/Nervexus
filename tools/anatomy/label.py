import numpy as np, json, collections
from scipy.spatial import cKDTree

# MUST stay identical to ZONE_NAMES in anatomy-3d.js, including the unused delts_rear slot.
# These indices are written straight into the model, so a mismatch silently lights the
# wrong muscle (calves became hamstrings the first time round).
ZONES=['','chest','lats','delts','delts_rear','biceps','triceps','forearms',
       'traps','abs','obliques','lower_back','glutes','quads','hamstrings','calves','adductors']
ARM={'delts','biceps','triceps','forearms'}
# glutes sit above the skin model's hip cut, so they belong with the torso in both
# models — grouping them with the leg shifts the whole thigh mapping downward.
LEG={'quads','hamstrings','calves','adductors'}
HAND_FRAC=0.88          # the skin arm runs to the fingertips; the muscle arm stops at the wrist
FOOT_FRAC=0.91          # likewise the skin leg runs to the sole, the muscle leg to the ankle
ZONE_CAP=9000           # obliques carry 6x the vertices of abs; raw nearest-neighbour
                        # then lets the denser mesh win every boundary vote

S=np.fromfile('skin_verts.f32',dtype=np.float32).reshape(-1,3).astype(np.float64)
M=np.fromfile('mus_verts.f32',dtype=np.float32).reshape(-1,3).astype(np.float64)
Z=np.fromfile('mus_zone.u8',dtype=np.uint8)
meta=json.load(open('skin_meta.json'))

sy0,sy1=S[:,1].min(),S[:,1].max(); H=sy1-sy0
scx=(S[:,0].min()+S[:,0].max())/2
u=(S[:,1]-sy0)/H; ax=np.abs(S[:,0]-scx)/H
B=dict(head=0.860, hips=0.439, armX=0.1146)

part=np.zeros(len(S),dtype=np.uint8)             # 0 skip, 1 torso, 2 arm, 3 leg
inbody=u<=B['head']
part[inbody]=1
# Anything out beyond the arm line is an arm, at any height. The hands hang BELOW the hip
# line on this model, so cutting legs by height alone swept the fingertips into the leg
# group and lit them up as quads.
part[inbody&(u<B['hips'])&(ax<=B['armX'])]=3
part[inbody&(ax>B['armX'])]=2
part[meta[0]['count']:]=0                        # eye mesh never lights

mz=np.array([ZONES[z] for z in Z])
mpart=np.where(np.isin(mz,list(ARM)),2,np.where(np.isin(mz,list(LEG)),3,1)).astype(np.uint8)

def frame(P, pca, ref):
    """Normalised local coords. Only the limb's long axis comes from PCA — the other
    two are pinned to anatomical front and lateral. PCA's own 2nd/3rd axes order
    differently in the two models, which silently swaps quads for hamstrings."""
    if pca:
        c=P.mean(0); Q=P-c
        _,v=np.linalg.eigh(np.cov(Q.T))
        a0=v[:,-1].copy()
        if a0 @ np.array([0.,-1.,0.]) < 0: a0=-a0        # proximal -> distal
        f=np.array([0.,0.,1.]); a1=f-(f@a0)*a0
        if np.linalg.norm(a1)<1e-6: a1=np.array([1.,0.,0.])-(np.array([1.,0.,0.])@a0)*a0
        a1/=np.linalg.norm(a1)
        a2=np.cross(a0,a1)
        L=Q@np.stack([a0,a1,a2],axis=1)
    else:
        L=P.copy()
    lo,hi=L.min(0),L.max(0)
    return (L-lo)/np.maximum(hi-lo,1e-9), lo, hi

DOWN=None

rng=np.random.default_rng(7)
labels=np.zeros(len(S),dtype=np.uint8)
for side in (-1,1):
    for pid in (2,3,1):
        if pid==1 and side==-1: continue
        if pid==1: sm=(part==1); mm=(mpart==1)
        else:
            sm=(part==pid)&(np.sign(S[:,0]-scx)==side)
            mm=(mpart==pid)&(np.sign(M[:,0])==side)
        if sm.sum()==0 or mm.sum()==0: continue
        pca = pid!=1
        A,_,_ = frame(S[sm], pca, DOWN)
        Bm,_,_ = frame(M[mm], pca, DOWN)
        if pid==2: A[:,0]=np.minimum(A[:,0]/HAND_FRAC, 1.0)   # squeeze the hand out
        if pid==3: A[:,0]=np.minimum(A[:,0]/FOOT_FRAC, 1.0)   # and the foot
        midx=np.where(mm)[0]
        keep=[]
        for zi in np.unique(Z[midx]):
            w=np.where(Z[midx]==zi)[0]
            if len(w)>ZONE_CAP:
                w=rng.choice(w, ZONE_CAP, replace=False)
            keep.append(w)
        keep=np.concatenate(keep)
        d,i=cKDTree(Bm[keep]).query(A,k=1)
        labels[np.where(sm)[0]]=Z[midx[keep[i]]]
        print(f"side={side:+d} part={pid} skin={sm.sum():6d} mus={mm.sum():6d} medianDist={np.median(d):.4f}")

# The external oblique's aponeurosis sheets across the midline on top of the rectus, so a
# nearest-surface query on the front of the abdomen lands on oblique every time. Reclaim the
# central strip for abs — that is what a user means when they say they trained abs.
ABS_HALFWIDTH=0.046          # fraction of body height, measured off the rectus in the muscle set
scz=(S[:,2].min()+S[:,2].max())/2
iabs, iobl = ZONES.index('abs'), ZONES.index('obliques')
mid=(labels==iobl)&(np.abs(S[:,0]-scx)/H < ABS_HALFWIDTH)&(S[:,2]>scz)
labels[mid]=iabs
print('midline reclaimed for abs:', int(mid.sum()))

# Adductor magnus has a large ischiocondylar belly on the posteromedial thigh, so the
# back of the leg legitimately resolves to "adductors". For a training app the back of
# the thigh is the hamstrings — reclaim it, keeping the inner thigh for adductors.
iham, iadd = ZONES.index('hamstrings'), ZONES.index('adductors')
lat=np.abs(S[:,0]-scx)/H
post=(labels==iadd)&(part==3)&(S[:,2]<scz)&(lat>0.028)
labels[post]=iham
print('posterior thigh reclaimed for hamstrings:', int(post.sum()))

# Hands and feet are tendon and small intrinsic muscle, none of which anyone trains as a
# group. Without this the wrist clamp pushes the whole hand into forearms and the whole
# foot into calves, so logging calf raises turns both feet red.
# Fingertips spread from t=0.75 to 1.0 along the arm axis because the hand splays, so a
# higher cut leaves half of them lit. 0.78 is roughly where the wrist sits on this arm.
ANKLE, WRIST = 0.045, 0.78
foot=(part==3)&(u<ANKLE)
labels[foot]=0
for side in (-1,1):
    sm=(part==2)&(np.sign(S[:,0]-scx)==side)
    if sm.sum()==0: continue
    A,_,_ = frame(S[sm], True, DOWN)
    hand=np.where(sm)[0][A[:,0]>WRIST]
    labels[hand]=0
print('feet excluded:', int(foot.sum()))

labels[part==0]=0
labels.tofile('zones.u8')
c=collections.Counter(labels.tolist())
print({ZONES[k]:v for k,v in sorted(c.items())})
