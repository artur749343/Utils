package org.init;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedList;
import java.util.List;

public class PrimeNumbers {
    public static void main(String[] args) {
        int[] array;
        float time1,time2,time3;
        System.out.println("primes from 1 to 100000");

        long nanoTime=System.nanoTime();
        array=primeArray(100000);
        time1=(System.nanoTime()-nanoTime)/1000000f;
        System.out.println("O(n^2) Standard algorithm, primeCount: "+array.length+", time: "+time1+" ms");

        nanoTime=System.nanoTime();
        array=sieveOfEratosthenes(100000);
        time2=(System.nanoTime()-nanoTime)/1000000f;
        System.out.println("O(n*log(n)) Sieve Of Eratosthenes, primeCount: "+array.length+", time: "+time2+" ms");

        nanoTime=System.nanoTime();
        array=primeOptimizedArray(100000);
        time3=(System.nanoTime()-nanoTime)/1000000f;
        System.out.println("O(n*log(n)) My algorithm(x3 times faster then sieve Of Eratosthenes), primeCount: "+array.length+", time: "+time3+" ms");

    }
    public static int[] primeArray(int count){
        List<Integer> primeNumbers=new ArrayList<>();
        for (int numCheck=2;numCheck<=count;numCheck++){
            boolean isPrime=true;
            for (int factor=2;factor<=numCheck/2;factor++){
                if (numCheck%factor==0){
                    isPrime=false;
                    break;
                }
            }
            if (isPrime){
                primeNumbers.add(numCheck);
            }
        }
        return primeNumbers.stream().mapToInt(i->i).toArray();
    }
    public static int[] sieveOfEratosthenes(int n) {
        boolean[] prime = new boolean[n+1];
        Arrays.fill(prime, true);
        for (int p=2;p*p<=n;p++) {
            if (prime[p]) {
                for (int i=p*2;i<=n;i+=p) {
                    prime[i]=false;
                }
            }
        }
        List<Integer> primeNumbers=new LinkedList<>();
        for (int i=2;i<=n;i++) {
            if (prime[i]) {
                primeNumbers.add(i);
            }
        }
        return primeNumbers.stream().mapToInt(i->i).toArray();
    }

    public static int[] primeOptimizedArray(int count){
        if (count<2) return new int[0];
        else if (count<3) return new int[]{2};
        else if (count<4) return new int[]{2, 3};
        final int[] primes=new int[(int)(count/(Math.log(count)-1.092))];
        final boolean[] isNotPrime=new boolean[count/3];
        int n=0;
        boolean odd=false;
        for (int i=0,num=5;num<count;i++,odd=!odd,num+=odd?2:4) {
            if (!isNotPrime[i]){
                primes[n++]=num;
                if (num*num<=count){
                    int j=2*num+i, k=2*num-4*i-(odd?5:7);
                    for (;j<isNotPrime.length;j+=2*num) {
                        isNotPrime[j-k]=true;
                        isNotPrime[j]=true;
                    }
                    if (j-k<isNotPrime.length) isNotPrime[j-k]=true;
                }
            }
        }
        final int[] result=new int[n+2];
        result[0]=2;
        result[1]=3;
        System.arraycopy(primes, 0, result, 2, n);
        return result;
    }
}
