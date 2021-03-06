import {IDerivation, notifyDependencyReady, notifyDependencyStale} from "./derivation";
import {globalState} from "./globalstate";

export interface IDepTreeNode {
	name: string;
	observers?: IDerivation[];
	observing?: IObservable[];
}

export interface IObservable extends IDepTreeNode {
	staleObservers: IDerivation[];
	observers: IDerivation[];
	onBecomeObserved();
	onBecomeUnobserved();
}

export function addObserver(observable: IObservable, node: IDerivation) {
	const obs = observable.observers, l = obs.length;
	obs[l] = node;
	if (l === 0)
		observable.onBecomeObserved();
}

export function removeObserver(observable: IObservable, node: IDerivation) {
	let obs = observable.observers, idx = obs.indexOf(node);
	if (idx !== -1)
		obs.splice(idx, 1);
	if (obs.length === 0)
		observable.onBecomeUnobserved();
}

export function reportObserved(observable: IObservable) {
	if (globalState.isTracking === false)
		return;
	const {derivationStack} = globalState;
	const deps = derivationStack[derivationStack.length - 1].observing;
	const depslength = deps.length;
	// this last item added check is an optimization especially for array loops,
	// because an array.length read with subsequent reads from the array
	// might trigger many observed events, while just checking the latest added items is cheap
	if (deps[depslength - 1] !== observable && deps[depslength - 2] !== observable)
		deps[depslength] = observable;
}

export function propagateStaleness(observable: IObservable|IDerivation) {
	const os = observable.observers.slice();
	os.forEach(notifyDependencyStale);
	observable.staleObservers = observable.staleObservers.concat(os);
}

export function propagateReadiness(observable: IObservable|IDerivation, valueDidActuallyChange: boolean) {
	observable.staleObservers.splice(0).forEach(
		o => notifyDependencyReady(o, valueDidActuallyChange)
	);
}
